import fs from 'fs';
import { DataStore } from './interface';

// YOU MAY MODIFY THIS OBJECT BELOW
let data: DataStore = {
  users: [],
  quizzes: [],
  sessions: [],
  quizGames: [],
  players: []
};

// YOU MAY MODIFY THIS OBJECT ABOVE

// YOU SHOULDNT NEED TO MODIFY THE FUNCTIONS BELOW IN ITERATION 1

/*
Example usage
  let store = getData()
  console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Rando'] }

  store.names.pop() // Removes the last name from the names array
  store.names.push('Jake') // Adds 'Jake' to the end of the names array

  console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Jake'] }
*/

// Use getData() to access the data
function getData(): DataStore {
  return data;
}

//  Use setData() to set data
function setData(inputData: DataStore) {
  data = inputData;
  fs.writeFileSync('./database.json', JSON.stringify(inputData, null, 2));
}

function clearData() {
  fs.unlinkSync('./database.json');
  loadData();
}

// Use loadData() to load the data from the data file and store it inside dataStore.ts
function loadData() {
  // Initialise database.json if it doesn't exist
  if (!fs.existsSync('./database.json')) {
    const initialData: DataStore = {
      users: [],
      quizzes: [],
      sessions: [],
      quizGames: [],
      players: []
    };

    fs.writeFileSync('./database.json', JSON.stringify(initialData, null, 2));
  }

  const inputData = JSON.parse(fs.readFileSync('./database.json').toString());
  setData(inputData);
}

const gameTimers = new Map<number, ReturnType<typeof setTimeout>>();

export { getData, setData, clearData, loadData, gameTimers };
