# Open ended features

This file is used to document any open-ended features that were implemented.

***

## Part A (Thinking Bigger with LLMs)

### Feature 1: Answer Explanation

#### Author:
Thomas Leng

#### Route: 
`/v1/player/{playerid}/question/{questionposition}/explanation`

#### Method: 
Use LLM to generate the response (`flan-t5-large`)

#### Description: 
Provide explanations for answers to help users understand the correct answer.  This is significant to the project because it allows the players to better understand why the answers(s) are correct for the question.

#### Technical Complexity: 
I faced the technical difficulty of not being able to find a good API for generating the response as the LLM from iteration 2 is down.  I fixed the issue after looking at the forum post "LLMs for iteration 3" and found out that `flan-t5-large` is a LLM that will work.  Also, I found it difficult to decide if my prompt was good enough to generate an explanation.  I solved this by using the API client POSTMAN to check if my prompt is allowing the LLM to return an explanation.

***

## Part B (Thinking Bigger with Files or Multi-user elements )

### Feature 1: Add Question Contributor

#### Author:
Lakshmi Narasimhan Srinivasan

#### Route: 
`/v1/admin/quiz/{quizId}/contributor`

#### Method: 
Makes use of a `POST` request to allow a quiz owner to add another registered user as a contributor.

#### Description:
Using this server request, a quiz owner can add another registered user to their quiz as a contributor. Contributors can only edit questions within quizzes but cannot alter the overall quiz.

#### Technical Complexity: 
When designing the contributor system, I faced issues when dealing with quiz ownerships. Especially when deciding how to store the contributors and the scope for a contributor. I settled on creating a seperate property in quizzes for contributors and gave them a limited scope, only being able to edit questions. Another issue that I faced whie dealing was adding contributor ownership checks to pre existing routes, while maintaining proper functioning of existing functions. However, with a little bit of patience and constant support from my teammates I was able to make sure the cntributor system works.

***
