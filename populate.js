const fs = require("fs-extra")
const axios = require('axios').default;
const path = require('path')
const yaml = require('js-yaml');
var { graphql, buildSchema } = require('graphql');

const l = console.log

async function createSchema() {
    l(`Updating schema...`)
    l(`Reading file "${process.env.SCHEMA_PATH}"`)
    const schema = await fs.readFileSync(process.env.SCHEMA_PATH, "utf-8");
    l(`Altering database`)
    await axios.post(process.env.GRAPHQL_SERVER + '/admin/schema', schema).then(r => console.log(r.status))
    l(`Schema updated !\n`)
}

async function populateWithYML(type, yml) {
    let json = JSON.stringify(yaml.load(yml)).replace(/"([^"]+)":/g, '$1:')
    const query = `
        mutation {
            add${type}(input: [
                ${json}
            ]) {
                ${type.toLowerCase()} {
                    name
                }
            }
        }
    `
    l(`Running query ${query}`)
    return axios.post(process.env.GRAPHQL_SERVER + '/graphql', query, { headers: { "content-type": "application/graphql" } })
        .then(r => console.log(r.status))
}

async function populate() {
    l(`Populating DB...`)
    l(`Reading YML directory "${process.env.YML_DB_PATH}"`)
    const dirs = await fs.readdirSync(process.env.YML_DB_PATH)
    l(`Found : ${dirs.join(", ")}`)
    const deepPromiseArray = dirs.map(dir => fs
        .readdir(path.join(process.env.YML_DB_PATH, dir))
        .then(files => files.map(file => fs
            .readFile(path.join(process.env.YML_DB_PATH, dir, file))
            .then(yml => populateWithYML(dir, yml))
            .then(() => queryAll(dir))
        ))
    )
    await Promise.all(deepPromiseArray.flat())
    l(`DB populated !\n`)
}

async function queryAll(type) {
    const query = `
        query {
            query${type} {
                name
            }
        }
    `
    l(`Running query ${query}`)
    return axios.post(process.env.GRAPHQL_SERVER + '/graphql', query, { headers: { "content-type": "application/graphql" } })
        .then(r => console.log('query result for ' + type + '\n', r.data.data))
}

async function main() {
    await createSchema()
    await populate()
}

main()