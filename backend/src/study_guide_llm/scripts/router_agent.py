from study_guide_llm.agents import llm, RouterOutput
from study_guide_llm.agents.instructions import ROUTER_INSTRUCTION
from langchain.messages import SystemMessage

llm = llm.with_structured_output(RouterOutput)

messages = llm.invoke([
    SystemMessage(ROUTER_INSTRUCTION),
    "Hello"
])

print(messages)

messages = llm.invoke([
    SystemMessage(ROUTER_INSTRUCTION),
    "I am a senior engineer at Google. Right now I want to learn about Neuroscience. Can you give me the roadmap for it?"
])
print("="*10)
print(messages)