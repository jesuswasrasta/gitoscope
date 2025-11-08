const git = require('../lib/git');

function respondWithJson(res, data) {
  res.send(JSON.stringify(data));
}

function promiseResponseFactory(gitFunction) {
  return async function (req, res, next) {
    try {
      res.setHeader('Content-Type', 'application/json');
      const data = await gitFunction();
      respondWithJson(res, data);
    } catch (err) {
      next(err);
    }
  };
}

function parametricResponse(gitFunction, paramName) {
  return async function (req, res, next) {
    try {
      res.setHeader('Content-Type', 'application/json');
      const data = await gitFunction(req.params[paramName]);
      respondWithJson(res, data);
    } catch (err) {
      next(err);
    }
  };
}
function parametricPromiseResponseFactory(gitFunction) {
  return parametricResponse(gitFunction, 'name');
}

const getReferences = promiseResponseFactory(git.getReferences);
const getStatus = promiseResponseFactory(git.getStatus);
const getTreeContent = parametricPromiseResponseFactory(git.getTreeContent);
const getWorkingCopyContent = parametricPromiseResponseFactory(git.getWorkingCopyContent);
const getCacheContent = parametricPromiseResponseFactory(git.getCacheContent);
const getCommit = parametricResponse(git.getCommit, 'commitId');
const getTreeRest = parametricResponse(git.getTreeRest, 'treeId');
const getBlobRest = parametricResponse(git.getBlobRest, 'blobId');

module.exports = {
  getStatus,
  getTreeContent,
  getWorkingCopyContent,
  getCacheContent,
  getCommit,
  getTreeRest,
  getBlobRest,
  getReferences,
};
