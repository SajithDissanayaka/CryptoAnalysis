"""Manual integration example; run this file directly to execute it."""


def main():
    from app.core.security import hash_password, verify_password


    password = "MyPassword123"

    hashed_password = hash_password(password)

    print("Original password:")
    print(password)

    print("\nHashed password:")
    print(hashed_password)

    print("\nCorrect password:")
    print(verify_password(password, hashed_password))

    print("\nWrong password:")
    print(verify_password("WrongPassword", hashed_password))

if __name__ == "__main__":
    main()
