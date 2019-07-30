const path = require("path");
const express = require("express");
const xss = require("xss");
const NotesService = require("./notes-service");
const uuid = require("uuid")

const notesRouter = express.Router();
const jsonParser = express.json();

const serializeNote = note => ({
  id: uuid(),
  folderId: xss(note.folderId),
  modified: now(),
  content: xss(note.content)
});

notesRouter
  .route("/")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    NotesService.getAllNotes(knexInstance)
      .then(note => {
        res.json(note.map(serializeNote));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { name, content, folderId } = req.body;
    const newNote = { name, content, folderId };

    for (const [key, value] of Object.entries(newNote))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing ${key} in request body` }
        });
    NotesService.insertNotes(req.app.get("db"), newNote)
      .then(note => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${folderId}/${note.id}`))
          .json(serializeNote);
      })
      .catch(next);
  });

  //RESUME ROUTER FROM HERE

  module.exports = notesRouter;