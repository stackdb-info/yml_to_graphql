const fs = require("fs-extra")
const axios = require('axios').default;
const path = require('path')
const yaml = require('js-yaml');
const queryAll = require('./queryAll').queryAll
const l = console.log

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

async function clearDb() {
    l(`Dropping DB...`)
    await axios.post(process.env.GRAPHQL_SERVER + '/alter', { "drop_all": true }).then(r => console.log(r.status))
    l(`DB dropped !`)
}

async function createSchema() {
    l(`Updating schema...`)
    l(`Reading file "${process.env.SCHEMA_PATH}"`)
    const schema = await fs.readFileSync(process.env.SCHEMA_PATH, "utf-8");
    l(`Altering database, schema`, schema)
    await axios.post(process.env.GRAPHQL_SERVER + '/admin/schema', schema).then(r => console.log(r.status))
    l(`Schema updated !\n`)
}

function generateAdd({ type, yml }) {
    let obj = yaml.load(yml)
    return `
        add${capitalize(type)}(input: {name: "${obj.name}"}) {
            ${type.toLowerCase()} {
                name
            }
        }
    `
}

function generateUpdate({ type, yml }) {
    let obj = yaml.load(yml)
    const name = obj.name
    delete obj.name
    let json = JSON.stringify(obj).replace(/"([^"]+)":/g, '$1:')
    return `
        update${capitalize(type)}(input: 
            { filter: {name: {eq: "${name}"}},
            set: ${json}
            }) {
            ${type.toLowerCase()} {
                name
            }
        }
    `
}

async function runQuery(query) {
    l(`Running query ${query}`)
    return axios.post(process.env.GRAPHQL_SERVER + '/graphql', query, { headers: { "content-type": "application/graphql" } })
        .then(r => console.log(r.status))
}

async function populate() {
    l(`Populating DB...`)
    l(`Reading YML directory "${process.env.YML_DB_PATH}"`)
    const dirs = await fs.readdirSync(process.env.YML_DB_PATH)
    l(`Found : ${dirs.join(", ")}`)
    const recursiveReads = dirs.map(dir =>
        fs.readdir(path.join(process.env.YML_DB_PATH, dir)) // Read the content of each dir
            .then(files => files.map(file => fs // For each file
                // Read it's content and generate the GraphQL add query
                .readFile(path.join(process.env.YML_DB_PATH, dir, file), 'utf8')
                .then(contents => ({ type: dir, yml: contents }))
            ))
    )

    // List of "add" GraphQL queries
    let contents = await Promise.all((await Promise.all(recursiveReads)).flat(2))
    await runQuery(`
        mutation {
            ${contents.map(generateAdd).join('')}
        }
    `)
    await runQuery(`
        mutation {
            ${contents.map(generateUpdate).join('')}
        }
    `)
    await runQuery(`
        mutation {
            addTypesList(input: [
                {
                    types: ${JSON.stringify(dirs)}
                }
            ]) {
                typesList {
                    types
                }
            }
        }
    `)
    l(`DB populated !\n`)
}

async function main() {
    await clearDb()
    await createSchema()
    await populate()
}

main()