const axios = require('axios').default;
const fs = require('fs-extra')

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function queryAll(type) {
    const query = `
        query {
            query${capitalize(type)} {
                name
            }
        }
    `
    console.log(`Running query ${query}`)
    return axios.post(process.env.GRAPHQL_SERVER + '/graphql', query, { headers: { "content-type": "application/graphql" } })
        .then(r => {
            if (r.data.data == undefined || Object.values(r.data.data)[0].length == 0) {
                console.error("No data received from DB : ", type, r.data.data)
                process.exit(2)
            }
            console.log('query result for ' + type + '\n', r.data.data)
        })
}

async function main() {
    const dirs = fs.readdirSync(process.env.YML_DB_PATH)
    console.log("reading dirs : ", dirs)
    await Promise.all(dirs.map(queryAll))
}

if (require.main === module) main()

module.exports.queryAll = queryAll