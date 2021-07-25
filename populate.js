const fs = require("fs-extra")
const axios = require('axios').default;
const path = require('path')
const yaml = require('js-yaml');
const queryAll = require('./queryAll').queryAll
const l = console.log

async function createSchema() {
    l(`Updating schema...`)
    l(`Reading file "${process.env.SCHEMA_PATH}"`)
    const schema = await fs.readFileSync(process.env.SCHEMA_PATH, "utf-8");
    l(`Altering database`)
    await axios.post(process.env.GRAPHQL_SERVER + '/admin/schema', schema).then(r => console.log(r.status))
    l(`Schema updated !\n`)
}

function generateAdd(type, yml) {
    let json = JSON.stringify(yaml.load(yml)).replace(/"([^"]+)":/g, '$1:')
    return `
        add${type}(input: [
            ${json}
        ]) {
            ${type.toLowerCase()} {
                name
            }
        }
    `
}

async function populate() {
    l(`Populating DB...`)
    l(`Reading YML directory "${process.env.YML_DB_PATH}"`)
    const dirs = await fs.readdirSync(process.env.YML_DB_PATH)
    l(`Found : ${dirs.join(", ")}`)
    const readDirsPromise = Promise.all(
        dirs.map(dir => fs
            .readdir(path.join(process.env.YML_DB_PATH, dir)) // Read the content of each dir
            .then(files => files.map( file => fs // For each file
                // Read it's content and generate the GraphQL add query
                .readFile(path.join(process.env.YML_DB_PATH, dir, file)) 
                .then(yml => generateAdd(dir, yml) )
            )))
    )
    // List of "add" GraphQL queries
    let adds = await Promise.all((await readDirsPromise).flat())
    const query = `
        mutation {
            ${adds.join()}
        }
    `
    l(`Running query ${query}`)
    await axios.post(process.env.GRAPHQL_SERVER + '/graphql', query, { headers: { "content-type": "application/graphql" } })
        .then(r => console.log(r.status))
    l(`DB populated !\n`)
}

async function main() {
    await createSchema()
    await populate()
}

main()