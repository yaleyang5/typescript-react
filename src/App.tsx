import { useEffect, useState } from 'react'
import { create } from 'zustand'
import './App.css'
import { useShallow } from 'zustand/react/shallow'
import axios from 'axios'

const NUM_OF_GUESSES = 6
const GUESS_LENGTH = 5

enum CorrectState {
  CORRECT = 'CORRECT',
  INCORRECT = 'INCORRECT',
  PARTIAL = 'PARTIAL'
}

interface WordleStore {
  correctAnswer: string
  setCorrectAnswer: (correctAnswer: string) => void
  guesses: string[][]
  setGuessesRow: (guess: string[], index: number) => void
  guessIndex: number
  setGuessIndex: (guessIndex: number) => void
  currentGuess: string
  setCurrentGuess: (currentGuess: string) => void
}

const useWordleStore = create<WordleStore>((set, get) => ({
  correctAnswer: '',
  setCorrectAnswer: (correctAnswer: string) => set({correctAnswer}),
  guesses: new Array(NUM_OF_GUESSES).fill(new Array(GUESS_LENGTH).fill("")),
  setGuessesRow: (guess: string[], index: number) => {
    const newGuesses = new Array(...get().guesses)
    newGuesses[index] = guess
    set({ guesses: newGuesses})
  },
  guessIndex: 0,
  setGuessIndex: (guessIndex: number) => set({ guessIndex }),
  currentGuess: '',
  setCurrentGuess: (currentGuess: string) => set({ currentGuess }),
}))

const getWordleWords = async () => {
  const wordString = await axios.get<string>(`https://gist.githubusercontent.com/dracos/dd0668f281e685bad51479e5acaadb93/raw/6bfa15d263d6d5b63840a8e5b64e04b382fdb079/valid-wordle-words.txt`)
  const wordArray = wordString.data.split(`\n`)
  wordArray.pop()
  return wordArray
}

const WordleGame = () => {
  const { guesses } = useWordleStore(
    useShallow((state) => ({
      guesses: state.guesses,  
    })),
  )
  return (
    <div className="wordle-game">
      {guesses.map((_guess, index) => {
        return <WordleRow key={index} index={index}/>
      })}
    </div>
  )
}

const WordleRow = ({index}: {index: number}) => {
  const { 
    guesses, 
    correctAnswer,
    guessIndex, 
    currentGuess,
  } = useWordleStore(
    useShallow((state) => ({
      guesses: state.guesses, 
      correctAnswer: state.correctAnswer,
      guessIndex: state.guessIndex, 
      currentGuess: state.currentGuess,
    })),
  )

  const currentlyBeingGuessed = index === guessIndex
  const isDone = index < guessIndex
  
  const getCorrectState = (letter: string, index: number) => {
    return correctAnswer[index] === letter ? CorrectState.CORRECT : correctAnswer.includes(letter) ? CorrectState.PARTIAL : CorrectState.INCORRECT
  }
  return (
    <div className="wordle-row">
      {currentlyBeingGuessed ? (
        guesses[guessIndex].map((_letter, index) => <WordleBox letter={currentGuess[index]} correctState={null} />)
      ) : (
        guesses[index].map((letter, letterIndex) => <WordleBox letter={letter} correctState={isDone ? getCorrectState(letter, letterIndex) : null} />)
      )}
    </div>
  )
}

const WordleBox = ({letter, correctState}: {letter: string, correctState: CorrectState | null}) => {
  // takes in a letter and a color
  // styles to make the letter uppercase
  // has padding, flexbox that centers letter
  return <div className={`wordle-box ${correctState ?? ""}`}>{letter}</div>
}

function App() {
  const [isGameOver, setIsGameOver] = useState(false)
  const [isHidingAnswer, setIsHidingAnswer] = useState(true)
  const [allWords, setAllWords] = useState<string[]>([])
  const { 
    guesses,
    setGuessesRow,
    guessIndex, 
    setGuessIndex, 
    correctAnswer,
    setCorrectAnswer,
    currentGuess, 
    setCurrentGuess 
  } = useWordleStore(
    useShallow((state) => ({
      guesses: state.guesses,
      setGuessesRow: state.setGuessesRow, 
      guessIndex: state.guessIndex, 
      setGuessIndex: state.setGuessIndex,
      correctAnswer: state.correctAnswer,
      setCorrectAnswer: state.setCorrectAnswer,
      currentGuess: state.currentGuess,
      setCurrentGuess: state.setCurrentGuess
    })),
  )

  const isMobile = window.innerWidth < 450

  const submitGuess = () => {
    if (!allWords.includes(currentGuess.toLowerCase())) {
      window.alert('not a valid word. try again')
      setCurrentGuess("")
      return
    }
    setGuessesRow(currentGuess.split(''), guessIndex)
    if (currentGuess === correctAnswer || guessIndex + 1 === NUM_OF_GUESSES) {
      setGuessIndex(guessIndex + 1)
      setCurrentGuess("")
      setIsGameOver(true)
      return
    }
    setGuessIndex(guessIndex + 1)
    setCurrentGuess("")
  }

  const handleInputChange = (e: any) => {
    if (isGameOver) return
    const lowerString = e.target.value.toLowerCase()
    setCurrentGuess(lowerString.slice(0, 5))
  }

  useEffect(() => {
    const getRandomWord = async () => {
      const allWordleWords = await getWordleWords()
      setAllWords(allWordleWords)
      const randomIndex = Math.floor(Math.random() * allWordleWords.length)
      const randomWord = allWordleWords[randomIndex]
      setCorrectAnswer(randomWord)
    }

    getRandomWord()
  }, [])

  useEffect(() => {
    if (isMobile) return

    const handleType = (e: KeyboardEvent) => {
      if (isGameOver) return

      const relevantChar = e.key.toLowerCase()

      if (relevantChar === "enter" && currentGuess.length === 5) {
        submitGuess()
        return
      }

      if (relevantChar === "backspace") {
        setCurrentGuess(currentGuess.slice(0, -1))
        return
      } 

      if (relevantChar.length > 1) return
      
      if (relevantChar.match(`^[a-z]+$`) && currentGuess.length < 5) {
        setCurrentGuess(currentGuess + relevantChar)
      }
    }

    window.addEventListener("keydown", handleType)

    return () => {      
      return window.removeEventListener("keydown", handleType)
    }
  }, [currentGuess])

  return (
    <>
      <h1>Wordle</h1>
      {isGameOver && (
        <div className="card">
          <div>
            {`${guessIndex >= NUM_OF_GUESSES && guesses[guesses.length - 1].join('') !== correctAnswer ? "Game over! " : "You got the word! "} The correct answer was ${correctAnswer}`}
          </div>
          <button onClick={() => { window.location.reload() }}>Play again</button>
        </div>
      )}
      <div className="card">
        <WordleGame />
      </div>
      {isMobile ? (
        <div className="card">        
          <input value={currentGuess} onChange={handleInputChange} maxLength={5} disabled={isGameOver} />
          <button onClick={submitGuess} disabled={isGameOver || currentGuess.length < 5}>Submit</button>
        </div>
      ) : (
        <p style={{ maxWidth: "300px" }}>Start typing to play! Press return/enter to submit your guess for the row.</p>
      )}
      <div className="hint">
        {!isHidingAnswer && <h3>Answer: {correctAnswer}</h3>}
        <button onClick={() => { setIsHidingAnswer(!isHidingAnswer)}}>{isHidingAnswer ? "Show" : "Hide"} answer</button>
      </div>
    </>
  )
}

export default App
