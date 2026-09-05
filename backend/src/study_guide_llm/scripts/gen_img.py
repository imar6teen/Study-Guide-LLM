from study_guide_llm.agents import agent


def main():
    image_bytes = agent.get_graph().draw_mermaid_png()

    with open("workflow_graph.png", "wb") as f:
        f.write(image_bytes)
    print("Graph saved")

if __name__ == "__main__":
    main()