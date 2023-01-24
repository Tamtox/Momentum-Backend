## Momentum

### Backend of Momentum application. Built with Typescript, Express, MongoDB. 


## Routes :

### 1) User routes (starts with /users) :
    /signup - create an account
    /login - log into existing account
    /verify - verify account with code
    /getUserData - returns an object with user data 
    /sendVerificationLetter - sends or re-sends a letter with confirmation code to user's email
    /changePassword - change existing user's password
    /resetPassword - reset existing user's password
    /delete - delete existing user account
### 2) Schedule routes (starts with /users) :
    /getSchedule - returns schedule entries for selected date
### 3) Todo routes (starts with /todo) :
    /getTodos - returns todo items 
    /getArchivedTodos - returns archived todo items
    /addNewTodo - creates new todo item
    /updateTodo - updates existing todo item
    /deleteTodo - deletes existing todo item
### 3) Journal routes (starts with /journal) :
    /getJournalEntry - returns journal entry for selected date if one exists
    /updateJournalEntry - creates/updates journal entry 
### 4) Habit routes (starts with /habits) :
    /getHabits - returns habits and their entries 
    /getArchivedHabits - returns archived habits 
    /addNewHabit - creates new habit and entries for current week
    /updateHabitEntryStatus - updates habit entry for specific date
    /updateHabit - updates habit and its entries if neccessary
    /populateHabit - populates habit with entries if it has none
    /updateHabitArchiveStatus - archives/unarchives habit
    /deleteHabit - deletes habit and its entries
### 5) Goal routes (starts with /goals) :
    /getGoals - returns gosl items 
    /getArchivedGoals - returns archived gosl items
    /addNewGoal - creates new gosl item
    /updateGoal - updates existing gosl item
    /deleteGoal - deletes existing gosl item