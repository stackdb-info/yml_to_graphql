const axios = require('axios').default;
const fs = require('fs-extra')

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

async function queryAll(type) {
    const query = `
        query {
            query${capitalize(type)} {
                name
            }
        }
    `
    console.log(`Running query ${query}`)
    return axios.post(process.env.GRAPHQL_SERVER + '/graphql', query, { headers: { "content-type": "application/graphql" } })
        .then(r => console.log('query result for ' + type + '\n', r.data.data))
}

function main() {
    const dirs = fs.readdirSync(process.env.YML_DB_PATH)
    console.log("reading dirs : ", dirs)
    dirs.forEach(queryAll)
}
if (require.main === module) main()

module.exports.queryAll = queryAll