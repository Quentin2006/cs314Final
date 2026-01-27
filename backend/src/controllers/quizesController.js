import Quiz from "../models/Quiz.js"
import Note from "../models/Note.js"
import ai, { DEFAULT_QUIZ_PROMPT } from "../config/gemini.js"

const generateQuizFromNote = async (note) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: DEFAULT_QUIZ_PROMPT + note,
    });

    return response.text;
  } catch (err) {
    throw err;
  }
}

export const getAllQuizes = async (req, res) => {
  try {
    // get all notes from DB
    const quizes = await Quiz.find().sort({ createdAt: -1 }); // show the newest first (decending order)
    res.status(200).json(quizes);
  }
  catch (error) {
    console.error("Error in getAllNotes controller: ", error.message)
    res.status(500).json({ message: "Server Error", error: error.message });
  }

}

export const getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    res.status(200).json(quiz);
  }
  catch (error) {
    console.error("Error in getQuiz controller: ", error.message)
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

export const createQuiz = async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);

    const response = JSON.parse(await generateQuizFromNote(note));

    if (!response.title || !response.subject || !response.questions) return res.status(400).json({ message: "Invalid quiz format from AI" });

    const quiz = new Quiz(response);
    const savedQuiz = await quiz.save();
    res.status(201).json(savedQuiz);
  } catch (error) {
    console.error("Error in createQuiz controller: ", error.message)
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

export const deleteQuiz = async (req, res) => {
  try {
    const deletedQuiz = await Quiz.findByIdAndDelete(req.params.id);

    if (!deletedQuiz) return res.status(404).json({ message: "Quiz not found" });

    res.status(200).json(deletedQuiz);
  }
  catch (error) {
    console.error("Error in deleteQuiz controller: ", error.message)
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}


