const simpleGit = require('simple-git');
const { promisify } = require('util');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const execAsync = promisify(exec);
const models = require('./gitModels');
const config = require('../config');

const repository = config.repo;

const getRepo = function() {
    return simpleGit(repository);
};

async function getListOfFilesInHeadCommit(){
    try {
        const { stdout } = await execAsync(`git ls-tree -r --name-only HEAD`, { cwd: repository });
        return stdout.trim().split('\n').filter(f => f);
    } catch (err) {
        return [];
    }
}

async function getCommit(commitId){
    const { stdout } = await execAsync(`git cat-file -p ${commitId}`, { cwd: repository });
    const lines = stdout.split('\n');

    let tree = '';
    const parents = [];
    let message = '';
    let author = '';
    let inMessage = false;

    for (const line of lines) {
        if (line.startsWith('tree ')) {
            tree = line.substring(5).trim();
        } else if (line.startsWith('parent ')) {
            parents.push(line.substring(7).trim());
        } else if (line.startsWith('author ')) {
            author = line.substring(7).trim();
        } else if (line === '') {
            inMessage = true;
        } else if (inMessage) {
            message += line + '\n';
        }
    }

    return models.commitFactory({
        id: () => ({ tostrS: () => commitId }),
        author: () => ({ toString: () => author }),
        message: () => message.trim(),
        parents: () => parents.map(p => ({ tostrS: () => p })),
        treeId: () => ({ tostrS: () => tree })
    });
}

async function getTreeRest(treeId){
    const { stdout } = await execAsync(`git cat-file -p ${treeId}`, { cwd: repository });
    const lines = stdout.trim().split('\n');
    const entries = [];

    for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 4) {
            const mode = parts[0];
            const type = parts[1];
            const sha = parts[2];
            const name = parts.slice(3).join(' ');

            entries.push({
                sha: () => sha,
                name: () => name,
                isTree: () => type === 'tree',
                isBlob: () => type === 'blob'
            });
        }
    }

    return models.treeFactory({
        id: () => ({ tostrS: () => treeId }),
        entries: () => entries
    });
}

async function getBlobRest(blobId){
    const { stdout: content } = await execAsync(`git cat-file -p ${blobId}`, { cwd: repository });
    const { stdout: sizeStr } = await execAsync(`git cat-file -s ${blobId}`, { cwd: repository });

    return models.blobFactory({
        id: () => ({ tostrS: () => blobId }),
        rawcontent: () => Buffer.from(content),
        rawsize: () => parseInt(sizeStr.trim())
    });
}

async function getReferences(){
    const git = getRepo();

    try {
        const refs = await git.raw(['show-ref']);
        const refLines = refs.trim().split('\n').filter(l => l);
        const references = [];

        for (const line of refLines) {
            const [sha, name] = line.split(' ');
            references.push(models.referenceFactory({
                name: () => name,
                target: () => ({ tostrS: () => sha }),
                isTag: () => name.startsWith('refs/tags/'),
                isBranch: () => name.startsWith('refs/heads/'),
                isHead: () => false,
                isSymbolic: () => false
            }, false));
        }

        // Add HEAD
        try {
            const headSha = await git.revparse(['HEAD']);
            const headRef = await git.raw(['symbolic-ref', 'HEAD']);

            references.push(models.referenceFactory({
                name: () => headRef.trim(),
                target: () => ({ tostrS: () => headSha.trim() }),
                isTag: () => false,
                isBranch: () => headRef.trim().startsWith('refs/heads/'),
                isHead: () => true,
                isSymbolic: () => true
            }, true));
        } catch (err) {
            // Detached HEAD or no commits
        }

        return references;
    } catch (err) {
        return [];
    }
}

function getDiffStatusString(gitoscopeStatus, rawStatus){
    if (gitoscopeStatus.isInWorkingCopy && !gitoscopeStatus.isInCache){
        return 'untracked';
    }
    if (!gitoscopeStatus.isInWorkingCopy && gitoscopeStatus.isInCache){
        return 'deleted';
    }
    if (rawStatus.inWorkingTree && ! rawStatus.isDeleted && !rawStatus.isNew){
        return 'modified';
    }
    return '';
}

function getDiffCachedStatusString(gitoscopeStatus, rawStatus){
    if (gitoscopeStatus.isInCache && !gitoscopeStatus.isInTree){
        return 'new';
    }
    if (!gitoscopeStatus.isInCache && gitoscopeStatus.isInTree){
        return 'deleted';
    }
    if (rawStatus.inIndex && rawStatus.isModified){
        return 'modified';
    }
    return '';
}

function buildDefaultStatus(){
    return {
        isInWorkingCopy: true,
        isInCache: true,
        isInTree: true,
        diffString: '',
        diffCachedString: ''
    }
}

async function getStatus(){
    const git = getRepo();
    const status = await git.status();
    const listOfFilesInHeadCommit = await getListOfFilesInHeadCommit();

    const res = {};

    // Process each file in git status
    for (const file of status.files) {
        const fileStatus = {
            isInWorkingCopy: file.working_dir !== 'D' && file.working_dir !== ' ',
            isInCache: file.index !== 'D' && file.index !== '?' && file.index !== ' ',
            isInTree: listOfFilesInHeadCommit.includes(file.path),
            rawStatus: {
                inWorkingTree: file.working_dir !== ' ' && file.working_dir !== '?',
                inIndex: file.index !== ' ' && file.index !== '?',
                isDeleted: file.working_dir === 'D',
                isNew: file.index === 'A' || file.working_dir === '?',
                isModified: file.index === 'M' || file.working_dir === 'M'
            }
        };

        // Adjust isInWorkingCopy for deleted files
        if (file.working_dir === 'D') {
            fileStatus.isInWorkingCopy = false;
        }

        fileStatus.diffString = getDiffStatusString(fileStatus, fileStatus.rawStatus);
        fileStatus.diffCachedString = getDiffCachedStatusString(fileStatus, fileStatus.rawStatus);

        res[file.path] = fileStatus;
    }

    // Add files from HEAD that aren't in status (unchanged files)
    for (const file of listOfFilesInHeadCommit) {
        if (!(file in res)){
            res[file] = buildDefaultStatus(file);
        }
    }

    return res;
}

async function getFile(entry){
    try {
        const { stdout } = await execAsync(`git show HEAD:"${entry}"`, { cwd: repository });
        return stdout;
    } catch (err) {
        return '';
    }
}

async function getWorkingCopyContent(resource){
    const filePath = path.join(repository, resource);

    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (err) {
        return '';
    }
}

async function getCacheContent(resource){
    try {
        const { stdout } = await execAsync(`git show :${resource}`, { cwd: repository });
        return stdout;
    } catch (err) {
        // If file is not in index, try to get it from HEAD
        return await getFile(resource);
    }
}

module.exports = {
    getStatus,
    getTreeContent: getFile,
    getWorkingCopyContent,
    getCacheContent,
    getCommit,
    getTreeRest,
    getBlobRest,
    getReferences
};
