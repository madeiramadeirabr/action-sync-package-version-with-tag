const { Octokit } = require("@octokit/core")
const github = require('@actions/github')
const core = require('@actions/core');
const base64 = require('base-64')
const axios = require('axios')
const githubToken = core.getInput('github-token')
const octokit = new Octokit({ auth: githubToken})
const branch = core.getInput('branch')
var path = core.getInput('path')

async function run(){
    if(githubToken){
        try{
            let newVersion = await getTag()
            setVersion(newVersion)
        }catch(error){
            core.setFailed('A branch ou arquivo não existe!')
        }
    }else{
        core.setFailed('O parâmetro github-token é obrigatório!')
    }
}

async function findTag(){
    let param = {
        owner: github.context.payload.repository.owner.name,
        repo: github.context.payload.repository.name
    }
    return octokit.request('GET /repos/{owner}/{repo}/git/refs/tags', param)
}

async function getTag(){
    let numberTag = await findTag()

    if(numberTag.status == 200){
        let lastTag = numberTag.data.pop().ref.split('/').pop()
        console.log('A tag encontrada é', lastTag)
        if(!validateTag(lastTag)){
            core.setFailed(`A tag ${lastTag} não é uma tag válida!`)
            return false
        }else{            
            return lastTag
        }            
    }else{
        core.setFailed("Nenhuma tag foi definida para seu projeto. Defina uma tag e execute a ação novamente")
        return false
    }
}

function validateTag(tag){
    let defaulTag = tag.match('([v0-9|0-9]+).([0-9]+).([0-9]+).([0-9]+)')
    
    if(defaulTag){
        return tag
    }
    
    defaulTag = tag.match('([v0-9|0-9]+).([0-9]+).([0-9]+)')
    if(defaulTag){
        return tag
    }
    
    return false
}


async function setVersion(newVersion){
    try{
        let content = await getContent()
        let {sha} = content.data
        let {download_url} = content.data
        if (download_url){
            let {data} = await getContentFile(download_url)
            modifyVersionAndUploadFile(data, sha, newVersion)
        }
    }catch(error){
        core.setFailed('Path invalido!')
    }
}

function modifyVersionAndUploadFile(data, sha, newVersion){
    if (data && data != ''){
        if(modifyVersion(data, newVersion) && modifyVersion(data, newVersion) != ''){
            let newFile = modifyVersion(data, newVersion)
            let fileBase64 = base64.encode(JSON.stringify(newFile))
            uploadGithub(fileBase64, path, sha)
        }else{
            core.setFailed('Falha ao atualizar a versão do package.json!')
        }
    }else{
        core.setFailed('Falha ao ler o arquivo!')
    }
}

function getContent(){
    if(path && path != ''){
        if(path.split('/').pop() == ''){
            path = path.slice(0, -1)
            path += '/package.json' 
        }else{
            path = `${path}/package.json`
        }
    }else{
        path = path != '' ? `${path}/package.json`: 'package.json'
        path = `package.json`
    }
    let param = {
        owner: github.context.payload.repository.owner.name,
        repo: github.context.payload.repository.name,
        path: path,
    }
    if (branch && branch != ''){
        param['ref'] = branch 
    }
    return  octokit.request('GET /repos/{owner}/{repo}/contents/{path}', param, (response)=>{
        if (response.status  == 200){
            return response
        }

        return false
    })
}

async function getContentFile (raw_url){
    try{
        return axios.get(raw_url, {
            headers: {
                Authorization: `Bearer ${githubToken}`
            }
        })
    }catch(error){
        core.setFailed('Erro ao obter o conteúdo do arquivo!')
    }
}

function modifyVersion (package_json_obj, newVersion){
    if(newVersion == '' || newVersion == undefined){
        console.log('É necessária uma nova versão!')
        return false
    }
    package_json_obj.version = newVersion
    return package_json_obj
}

async function uploadGithub(content, fileName, sha){
    if(path.substr(0, 1) == '/'){
        path = path.substr(1)
    }

    let param = {
        owner: github.context.payload.repository.owner.name,
        repo: github.context.payload.repository.name,
        path: path,
        message: `ci: Update ${fileName}`,
        content: content,
        sha: sha
    }
    
    uploadFileBase64(param, fileName)
}

async function uploadFileBase64(param, fileName){
    try{
        if (branch && branch != ''){
            delete param.ref
            param['branch'] = branch 
        }
        await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', param).then(()=>{
            
            let message = `Arquivo ${fileName} atualizado`
            console.log({
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                },
                'body': {
                    'message': message,
                }
            })
            core.setOutput("success", message)
            
        })
    }catch(error){
        core.setFailed("Error ao commitar file: ",error)
    }
}
run()