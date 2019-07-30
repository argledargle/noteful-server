const path = require("path");
const express = require("express");
const xss = require("xss");
const NotesService = require("./notes-service");

const notesRouter = express.Router();
const jsonParser = express.json();

const serializeNewNote = note => ({
  id: note.id,
  folderid: xss(note.folderid),
  modified: xss(Date.now()),
  content: xss(note.content),
  name: xss(note.name)
});

const serializeNote = note => ({
  id: note.id,
  folderid: xss(note.folderid),
  modified: xss(note.modified),
  content: xss(note.content),
  name: xss(note.name)
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
    const { name, content, folderid } = req.body;
    const newNote = { name, content, folderid };

    for (const [key, value] of Object.entries(newNote))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing ${key} in request body` }
        });
    NotesService.insertNotes(req.app.get("db"), newNote)
      .then(note => {
        res
          .status(201)
          .location(
            path.posix.join(req.originalUrl, `/${note.folderid}/${note.id}`)
          )
          .json(serializeNewNote(note));
      })
      .catch(next);
  });

//this where we try to get all notes from a folder by folderid
notesRouter.route("/content/:folderid").get((req, res, next) => {
  NotesService.getByFolderId(req.app.get("db"), req.params.folderid)
   .then(folder => {
      if (!folder) {
        return res.status(404).json({
          error: { message: `Folder doesn't exist` }
        });
      }
      res.note = note;
      next();
    })
    .catch(next);
}).get((req, res, next)=> {
    res.json(note.map(serializeNote))
})

notesRouter
  .route("/:note_id")
  .all((req, res, next) => {
    NotesService.getById(req.app.get("db"), req.params.note_id)
      .then(note => {
        if (!note) {
          return res.status(404).json({
            error: { message: `Note doesn't exist` }
          });
        }
        res.note = note;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeNote(res.note));
  })
  .delete((req, res, next) => {
    NotesService.deleteNote(req.app.get("db"), req.params.note_id)
      .then(numRowsAffects => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { name, content } = req.body;
    const noteToUpdate = { name, content };

    const numberofValues = Object.values(noteToUpdate).filter(Boolean).length;
    if (numberofValues === 0)
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'name' or 'content'`
        }
      });

    NotesService.updateNote(req.app.get("db"), req.params.note_id, noteToUpdate)
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = notesRouter;
