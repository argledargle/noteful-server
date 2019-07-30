const path = require("path");
const express = require("express");
const xss = require("xss");
const FolderService = require("./folders-service");

const foldersRouter = express.Router();
const jsonParser = express.json();

const serializeFolder = folder => ({
    id: folder.id,
    name: xss(folder.name)
});

foldersRouter.route("/")
.get((req, res, next) => {
    const knexInstance = req.app.get("db");
    FolderService.getAllFolders(knexInstance)
    .then(folder => {
        res.json(folder.map(serializeFolder));
    })
    .catch(next)
})


module.exports = foldersRouter;
