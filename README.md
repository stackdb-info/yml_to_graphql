# yml_to_graphql
Convert a static [YML-file-based DB](https://github.com/stackdb-info/db) to [GraphQL](https://graphql.org) compatible DB like [dgraph](https://dgraph.io).

## Usage
1) Create your [YML-file-based DB](https://github.com/stackdb-info/db) by creating
    - A schema definition file `schema.graphql`
    - A directory containing a sub-directory for each type in your schema and YML files defining instances of those types.

    Example: https://github.com/stackdb-info/db

2) Define ENV variables and run the converter
    - `SCHEMA_PATH` : Path to your schema file
    - `YML_DB_PATH` : Path to the root of directory containing type directories
    - `GRAPHQL_SERVER` : DGraph entrypoint

    See [package.json](./package.json) for start command example.

3) Run `node populate.js`. You're done !

