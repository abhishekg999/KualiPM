export const makeGraphQLQuery = async (endpoint, apikey, body) => {
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apikey}`,
            },
            body: body
        })
        const data = await res.text();
        return data;
    } catch (err) {
        throw err;
    }
}

export const getAllCategories = async (endpoint, apikey) => {
    const query = `query CategoryNames($q: String, $skip: Int!, $limit: Int!, $sort: [String!]) {
		categoriesConnection(args: {query: $q, skip: $skip, limit: $limit, sort: $sort}) {
			totalCount
			edges {
				node {
					id
					name
					parentId
				}
			}
		}
	}`

    const variables = {
        "skip": 0,
        "limit": 1000,
        "sort": []
    }

    const result = await makeGraphQLQuery(
        endpoint,
        apikey,
        JSON.stringify({ query, variables }),
    )

    return result;
}


export const giveUserAdminInGroup = async (endpoint, apikey, userId, groupId) => {
    const query = `mutation AddGroupRoleUser($groupId: ID!, $roleId: String, $userId: String!) {
		addGroupRoleUser(groupId: $groupId, roleId: $roleId, userId: $userId) {
			result {
				memberIds
			}
		}
	}`

    const variables = {
        groupId: groupId,
        roleId: "admins",
        userId: userId
    }

    const result = await makeGraphQLQuery(
        endpoint,
        apikey,
        JSON.stringify({ query, variables }),
    )

    return result;
}


export const getAllGroups = async (endpoint, apikey, n = 50) => {
    let hasNext = true;

    const query = `query GroupsByParent($skip: Int, $limit: Int) {
        groupsConnection(args: {skip: $skip, limit: $limit}) {
          totalCount
          edges {
            node {
              id
              name
              category {
                id
              }
            }
          }
          pageInfo {
            hasNextPage
            skip
            limit
          }
        }
      }`

    const variables = {
        skip: 0,
        limit: n
    }

    let edges = []

    while (hasNext) {
        console.log("GETTING GROUPS...");
        const result = await makeGraphQLQuery(
            endpoint,
            apikey,
            JSON.stringify({ query, variables }),
        )

        const data = JSON.parse(result);

        edges = edges.concat(data.data.groupsConnection.edges);

        variables.skip += n;
        hasNext = data.data.groupsConnection.pageInfo.hasNextPage;
    }

    console.log("DONE", edges.length);


    return edges;
}


export const getAllGroupsWithCategory = async (endpoint, apikey, categoryId) => {
    const query = `query GetGroups($categoryId: ID) {
		groupsConnection(args: {limit: 1000, categoryId: $categoryId}) {
			totalCount
			edges {
				node {
					id
					name
					categoryId
				}
		  	}
			pageInfo {
				hasNextPage
				skip
				limit
			}
		}
	  }
	  `

    const variables = {
        categoryId: categoryId
    }

    const result = await makeGraphQLQuery(
        endpoint,
        apikey,
        JSON.stringify({ query, variables }),
    )

    return result;
}


export const getAllSubCategories = (graph, base_id) => {
    const result = graph[base_id].map((child) => getAllSubCategories(graph, child)).flat();
    result.push(base_id);
    return result;

}

export const getAllUsersByQuery = async (endpoint, apikey, q) => {
    const query = `query GetUsers($query: String) {
      usersConnection(args: {limit: 20, query: $query}) {
        edges {
          node {
            id
            label: displayName
            displayName
            schoolId
            username
            email
          }
        }
      }
    }`

    const variables = {
        query: q
    }

    const result = await makeGraphQLQuery(
        endpoint,
        apikey,
        JSON.stringify({ query, variables }),
    )

    return result;
}

export const assignAdminToCategory = async (endpoint, apikey, graph, userId, categoryId) => {
    const blueprintsToAdd = getAllSubCategories(graph, categoryId);

    //console.log(blueprintsToAdd);
    blueprintsToAdd.map(async (blueprintId) => {
        const category_groups = await getAllGroupsWithCategory(
            endpoint,
            apikey,
            blueprintId,
        )

        const data = JSON.parse(category_groups);
        const edges = data.data.groupsConnection.edges;
        console.dir(edges, { depth: null });

        edges.map((edge) => {
            giveUserAdminInGroup(
                endpoint,
                apikey,
                userId,
                edge.node.id
            )
        })
    });
}


export const JSONCategoriesToGraph = (raw_data) => {
    const data = JSON.parse(raw_data);
    const categories = data.data.categoriesConnection.edges;

    const graph = {}
    const id_to_name = {}

    for (const category of categories) {
        graph[category.node.id] = []
        id_to_name[category.node.id] = category.node.name;
    }

    for (const category of categories) {
        if (category.node.parentId !== null) {
            graph[category.node.parentId].push(category.node.id)
        }
    }

    return [graph, id_to_name];
}

export const JSONGroupsToCategoryMap = (edge_list) => {
    const map = {}
    map["null"] = []
    edge_list.forEach((el => {
        if (el.node.category) {
            map[el.node.category.id] = []
        }
    }));

    edge_list.forEach((el => {
        if (el.node.category) {
            map[el.node.category.id].push(el)
        } else {
            map["null"].push(el)
        }
    }));

    return map;
}

export function createTree(adjList, idMap) {
    // Find all the nodes that are parents but not children
    const parentIds = new Set(Object.keys(adjList));
    Object.values(adjList).forEach(children => {
        children.forEach(child => {
            parentIds.delete(child);
        });
    });

    // Create a virtual root node to hold all the parent nodes
    const rootNode = { id: 'root', name: 'Root', children: [] };
    const nodeMap = new Map([['root', rootNode]]);

    // Add each parent node and its children to the tree
    parentIds.forEach(parentId => {
        const parentName = idMap[parentId];
        const parentNode = { id: parentId, name: parentName, children: [] };
        rootNode.children.push(parentNode);
        nodeMap.set(parentId, parentNode);

        function addChildren(node) {
            const childrenIds = adjList[node.id] || [];
            for (let i = 0; i < childrenIds.length; i++) {
                const childId = childrenIds[i];
                const childName = idMap[childId];
                const childNode = { id: childId, name: childName, children: [] };
                node.children.push(childNode);
                nodeMap.set(childId, childNode);
                addChildren(childNode);
            }
        }

        addChildren(parentNode);
    });

    // If there's only one parent, return the parent directly instead of the virtual root node
    if (rootNode.children.length === 1) {
        return rootNode.children[0];
    } else {
        return rootNode;
    }
}