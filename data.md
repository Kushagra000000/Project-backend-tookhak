```javascript
let data = {
    users: [
        {
            userId: Integer, 
            email: "String", 
            nameFirst: "String", 
            nameLast: "String", 
            password: "String",
            numSuccessfulLogins: Integer, 
            numFailedPasswordsSinceLastLogin: Integer
        }
    ],
    quizzes: [
        {
            userId: Integer, 
            quizId: Integer, 
            name: "String", 
            description: "String", 
            timeCreated: Integer, 
            timeLastEdited: Integer
        }
    ]
}
```

[Optional] short description: 
For the users array: 
-   nameLast and nameFirst are required for account registration and detail updates.
-   Email and password are necessary for logins, account details, and account updates
-   userId is essential for finding account details and updating account information.
-   numSuccessfulLogins and numFailedPasswordsSinceLastLogin are parts of the users’ details.

For the quizzes array: 
-   userId is required for all functions.
-   Name and description are the basic information needed to create a new quiz.
-   quizId is the identification of a specific quiz.
-   timeCreated and timeLastEdited are parts of quiz information.
