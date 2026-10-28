"""Manual integration example; run this file directly to execute it."""


def main():

    from app.services.embedding_service import (
        generate_embedding,
    )


    text1 = "Bitcoin price increased today."
    text2 = "BTC market value went up today."
    text3 = "The weather is rainy today."


    print("Generating embeddings...\n")

    vector1 = generate_embedding(text1)
    vector2 = generate_embedding(text2)
    vector3 = generate_embedding(text3)


    print("Text 1 vector dimensions:", len(vector1))
    print("Text 2 vector dimensions:", len(vector2))
    print("Text 3 vector dimensions:", len(vector3))

    print("\nFirst 5 vector values:")
    print(vector1[:5])

    print("\nEmbedding generation successful!")


if __name__ == "__main__":
    main()
