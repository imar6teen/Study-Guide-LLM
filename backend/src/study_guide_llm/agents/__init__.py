from typing import TypedDict, Literal
from pydantic import BaseModel, Field
from langchain.messages import AnyMessage
from langchain_core.messages import AIMessage, SystemMessage, HumanMessage, ToolMessage
# from langchain_core.prompts import PromptTemplate
from langchain_ollama import ChatOllama
from langgraph.graph import MessagesState, StateGraph, START, END
from langgraph.types import Command
from typing_extensions import Annotated
from operator import add
from enum import Enum

from study_guide_llm.configs import MODEL_NAME
from study_guide_llm.agents.tools import web_scraper, web_search, SearchResult
from study_guide_llm.agents.instructions import (
    PLANNER_INSTRUCTION, 
    TEACHER_INSTRUCTION, 
    RESPONSE_INSTRUCTION, 
    ROUTER_INSTRUCTION
)

from study_guide_llm.configs import DB_URI
from langgraph.checkpoint.postgres import PostgresSaver

tools = [web_scraper, web_search]
tools_by_name = {tool.name: tool for tool in tools}

class AGENT_NAME(str, Enum):
    ROUTER = "router"
    PLANNER = "planner"
    TEACHER = "teacher"
    RESPONSE = "response"

class Revision(TypedDict):
    topic : str | None
    subtopic : list[str] | None
    messages : list[str] # if topic is str then messages should be only 1 message, if subtopic is list then messages should be len of subtopic

class GraphState(MessagesState):
    messages : Annotated[list[AnyMessage], add]
    current_batch_messages : list[AnyMessage]
    goto : str
    active_agent : AGENT_NAME
    active_iteration : int
    topic : str | None
    subtopic : list[str] | None
    detail_subtopic : list[str] | None
    web_search_result : list[SearchResult] | None
    web_scrape_result : dict[str, str] | None # [url, markdown]
    references : dict[str, list[str]] | None # this is for references that are being used by planner/teacher so reviewer doesn't have to search again
    out_of : str
    user_message : str


llm = ChatOllama(
    model=MODEL_NAME,
    temperature=0.9
)

class RouterOutput(BaseModel):
    topic : str | None = Field(
        None,
        description="Topic of the study guide, get it from what user ask",
    )
    goto : Literal["planner", "teacher", "response"] = Field(
        description="Next agent to visit. if topic is None then goto is response.",
    )
    user_message : str | None = Field(
        None,
        description="User message",
    )

class PlannerOutput(BaseModel):
    subtopic : list[str]
    references : dict[str, list[str]] | None = Field(
        None,
        description="References for each subtopic",
    )

class TeacherOutput(BaseModel):
    detail_subtopic : list[str] | None = Field(
        None,
        description="Detail subtopic for each subtopic, get it from what user ask",
    )
    references : dict[str, list[str]] | None = Field(
        None,
        description="References for each subtopic. Not all references (from planner) should be referenced",
    )


def router_agent(state : GraphState):
    structured_response = llm.with_structured_output(RouterOutput, include_raw=True, method="json_schema")

    if type(state["messages"][-1]) is not HumanMessage:
        #* Skipping to response agent since the previous message is not from human
        return Command(
            goto=AGENT_NAME.RESPONSE.value,
            update={
                "messages" : [AIMessage(content="The previous message is not from human. Answer to the user there is something wrong.")]
            }
        )

    messages = [
        SystemMessage(ROUTER_INSTRUCTION),
        state["messages"][-1]
    ]

    if state.get("topic", None) is not None:
        rev_messages = state.get("messages")[::-1]
        latest_response_agent_message = ""
        for i in rev_messages:
            if isinstance(i, AIMessage) and i.additional_kwargs.get("agent") == AGENT_NAME.RESPONSE.value:
                latest_response_agent_message = i.content
                break
        messages = [
            SystemMessage(ROUTER_INSTRUCTION),
            latest_response_agent_message,
            state["messages"][-1]
        ]

    response = structured_response.invoke(messages)
    parsed_response : RouterOutput = response["parsed"]

    return {
        "messages" : [response["raw"]],
        "out_of" : AGENT_NAME.ROUTER.value,
        "topic" : parsed_response.topic,
        "goto" : parsed_response.goto,
        # "user_message" : parsed_response.user_message,
        "user_message" : state["messages"][-1].content,
    }

def planner_agent(state : GraphState):
    # 1. Get the topic from router
    # 2. Check if there is previous reference
    # 3. If reference is present, check if it is enough, if not then search more using web search tool
    # 4. If reference is not present, search using web search tool
    # 5. Check if the subtopic is complete using the current reference
    # 6. If the subtopic is complete, move to the next subtopic
    # 7. If the subtopic is not complete, continue the planning process
    # 8. When subtopic is complete, add the planner message to the state
    topic = state.get("topic", None)

    tool_llm = llm.bind_tools(tools)
    structure_llm = llm.with_structured_output(PlannerOutput, include_raw=True, method="json_schema")

    revision = state.get("revision", "")
    addition_message = """"""

    if revision != "":
        addition_message += f"""
            You are rejected by the reviewer agent for topic "{revision["topic"]}".
            Revision message : 
            {revision["messages"]}
        """

    if state.get("current_batch_messages") is None:

        result = tool_llm.invoke([
            SystemMessage(content=PLANNER_INSTRUCTION),
            AIMessage(content=f"""
                {addition_message}

                User wants to make study guide for : {topic}
                Currently there is no reference.
            """)
        ])

        if result.tool_calls:
            return Command(
                goto="tool_node",
                update={
                    "messages" : [result],
                    "current_batch_messages" : [
                        result
                    ],
                    "active_agent" : AGENT_NAME.PLANNER.value,
                    "active_iteration" : 0
                }
            )
    elif state["active_iteration"] < 5:
        cbm = state.get("current_batch_messages")
        result = tool_llm.invoke([
            SystemMessage(content=PLANNER_INSTRUCTION),   
        ] + cbm)
        
        if result.tool_calls:
            return Command(
                goto="tool_node",
                update={
                    "messages" : [result],
                    "current_batch_messages" : state["current_batch_messages"] + [
                        result
                    ],
                    "active_agent" : AGENT_NAME.PLANNER.value,
                    "active_iteration" : state["active_iteration"] + 1,
                    "revision" : None
                }
            )
    
    cbm = state.get("current_batch_messages")
    result = structure_llm.invoke([
        SystemMessage(content=PLANNER_INSTRUCTION),   
    ] + cbm)

    parsed_result : PlannerOutput = result["parsed"]

    return Command(
        goto="teacher",
        update={
            "messages" : [result["raw"]],
            "out_of" : AGENT_NAME.PLANNER.value,
            "subtopic" : parsed_result.subtopic,
            "references" : parsed_result.references,
            "goto" : "teacher",
            "current_batch_messages" : [],
            "active_iteration" : 0,
        }
    )

def teacher_agent(state : GraphState):
    if state["out_of"] == "router":
        rev_messages = state.get("messages")[::-1]
        latest_response_agent_message = ""
        for i in rev_messages:
            if isinstance(i, AIMessage) and i.additional_kwargs.get("agent") == AGENT_NAME.RESPONSE.value:
                latest_response_agent_message = i.content
                break
        addition_message = f"""
            User asking about {state.get("user_message")}
            
            Last response from the previous agent:
            {latest_response_agent_message}

            Explain it in details based on what the user asked. Don't be too brief.
        """

        result = llm.invoke([
            AIMessage(content=addition_message)
        ])

        return Command(
            goto=AGENT_NAME.RESPONSE.value,
            update={
                "messages" : [result]
            }
        )
        
    subtopics = state["subtopic"]
    references = state["references"]
    web_scrape_result = state.get("web_scrape_result", {})
    tool_llm = llm.bind_tools([web_scraper])
    structure_llm = llm.with_structured_output(TeacherOutput, include_raw=True, method="json_schema")   
    addition_message = f"""
    You are given with these references :
    {references}

    You are also given with these web scrape result :
    {web_scrape_result}

    Here are the subtopic you need to create content for :
    {subtopics}

    If you need more reference to create the content, use web scrape tool. 
    """
    if len(state.get("current_batch_messages", [])) == 0:
        result = tool_llm.invoke([
            SystemMessage(content=TEACHER_INSTRUCTION),
            AIMessage(content=addition_message),
        ])
        if result.tool_calls:
            return Command(
                goto="tool_node",
                update={
                    "messages" : result,
                    "current_batch_messages" : [
                        result
                    ],
                    "active_agent" : AGENT_NAME.TEACHER.value,
                    "active_iteration" : 0,
                }
            )
    elif state.get("active_iteration", 0) < 5:
        cbm = state.get("current_batch_messages")
        result = tool_llm.invoke([
            SystemMessage(content=TEACHER_INSTRUCTION),
        ] + cbm + [AIMessage(content=addition_message)])
        
        if result.tool_calls:
            return Command(
                goto="tool_node",
                update={
                    "messages" : result,
                    "current_batch_messages" : state["current_batch_messages"] + [
                        result
                    ],
                    "active_agent" : AGENT_NAME.TEACHER.value,
                    "active_iteration" : state["active_iteration"] + 1,
                }
            )
        
    cbm = state.get("current_batch_messages", [])
    result = structure_llm.invoke([
        SystemMessage(content=TEACHER_INSTRUCTION),
    ] + cbm + [AIMessage(content=addition_message)])

    parsed_result : TeacherOutput = result["parsed"]
    
    return Command(
        goto="response",
        update={
            "messages" : [result["raw"]],
            "out_of" : AGENT_NAME.TEACHER.value,
            "detail_subtopic" : parsed_result.detail_subtopic,
            "references" : parsed_result.references,
            "current_batch_messages" : [],
            "active_iteration" : 0,
        }
    )

def response_agent(state : GraphState):
    topic = state.get("topic", None)
    subtopics = state.get("subtopic", None)
    detail_subtopics = state.get("detail_subtopic", None)
    references = state.get("references", None)
    user_message = state.get("user_message", None)
    out_of = state.get("out_of", None)
    ai_msg = None

    if out_of == "router":
        ai_msg = AIMessage(content=f"From : {out_of}")
    else:
        ai_msg = AIMessage(content=f"""
        Topic : {topic}
        Subtopics : {subtopics}
        Detail Subtopics : {detail_subtopics}
        Referencess : {references}
        From : {out_of}
        """)
    
    messages = [
        SystemMessage(content=RESPONSE_INSTRUCTION),
        ai_msg,
        HumanMessage(content=user_message)
    ]
    
    result = llm.invoke(messages)
    result.additional_kwargs["agent"] = AGENT_NAME.RESPONSE.value

    return {
        "messages" : [result],
        "out_of" : AGENT_NAME.RESPONSE.value,
    }


    

def tool_node(state : GraphState):
    last_message : AIMessage = state["messages"][-1]
    scrape, search = state.get("web_scrape_result", {}), state.get("web_search_result", [])
    results = []
    for tool_call in last_message.tool_calls:
        tool = tools_by_name[tool_call["name"]]
        observation = tool.invoke(tool_call["args"])
        results.append(ToolMessage(content=observation, tool_call_id=tool_call["id"]))

        if tool_call["name"] == "web_scrape":
            scrape[tool_call["args"]["url"]] = observation
        elif tool_call["name"] == "web_search":
            search.extend(observation)
            
    return Command(
        goto=state["active_agent"],
        update={
            "messages" : results,
            "current_batch_messages" : state["current_batch_messages"] + results,
            "active_iteration" : state["active_iteration"] + 1,
            "web_scrape_result" : scrape,
            "web_search_result" : search,
        }
    )

def conditional_edges(state : GraphState):
    return state["goto"]

agent_builder = StateGraph(GraphState)
agent_builder.add_node("tool_node", tool_node)
agent_builder.add_node("router", router_agent)
agent_builder.add_node("planner", planner_agent)
agent_builder.add_node("teacher", teacher_agent)
agent_builder.add_node("response", response_agent)

agent_builder.add_edge(START, "router")
agent_builder.add_conditional_edges("router", conditional_edges, {
    "response" : "response",
    "planner" : "planner",
    "teacher" : "teacher"
})
# Routing for planner→teacher and teacher→response is handled by Command objects
# inside the node functions, so no static edges are needed here.
agent_builder.add_edge("response", END)


