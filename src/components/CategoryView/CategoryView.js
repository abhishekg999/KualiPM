import React, { useContext, useEffect, useInsertionEffect, useState } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { Box } from '@mui/material';
import { getAllCategories, JSONCategoriesToGraph, createTree } from '../../util/kuali.mjs';
import TreeView from '@mui/lab/TreeView';
import TreeItem from '@mui/lab/TreeItem';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import CircularProgress from '@mui/material/CircularProgress';


function CategoryView() {
	const { userContext, setUserContext } = useContext(UserContext);
	const [url, setUrl] = useState('');
	const [apiKey, setApiKey] = useState('')
	const [categories, setCategories] = useState([]);

	const [graph, setGraph] = useState(userContext.category_graph);
	const [idToName, setIdToName] = useState(userContext.id_to_name);

	const [isLoading, setIsLoading] = useState(false);

	const subdomainToUrl = (subdomain) => {
		return `https://${subdomain}.kualibuild.com/app/api/v0/graphql`;
	}

	useEffect(() => {
		if (userContext.subdomain) {
			setUrl((prev) => subdomainToUrl(userContext.subdomain));
		}

		if (userContext.api_key) {
			setApiKey((prev) => userContext.api_key);
		}

		if (userContext.idToName) {
			setIdToName((prev) => userContext.idToName);
		}

		if (userContext.category_graph) {
			setGraph((prev) => userContext.category_graph);
		}

	}, [userContext]);

	useEffect(() => {
		console.log(url);
	}, [url]);



	useEffect(() => {
		if (!url || !apiKey) {
			return;
		}
		const handleNewUrl = async () => {
			try {
				const raw_data = await getAllCategories(url, apiKey);
				const [graph, id_to_name] = JSONCategoriesToGraph(raw_data);

				setGraph((prev) => graph);
				setIdToName((prev) => id_to_name);
			} catch (e) {
				console.log(e);
			} finally {
				setIsLoading(() => false);
			}

		};

		setIsLoading(() => true);
		handleNewUrl();
	}, [url, apiKey])

	useEffect(() => {
		setUserContext((prev) => {
			return { ...prev, category_graph: graph, id_to_name: idToName }
		})
		setCategories(createTree(graph, idToName));
	}, [graph, idToName]);


	const [expanded, setExpanded] = useState(["root"]);
	const [selected, setSelected] = useState("root");

	const handleToggle = (event, nodeIds) => {
		setExpanded(nodeIds);
	};

	const handleSelect = (event, nodeIds) => {
		setSelected(nodeIds);
	};

	useEffect(() => {
		setUserContext((prev) => {
			return { ...prev, selected_categories: selected }
		})
	}, [selected]);

	const renderTree = (nodes) => {
		return (
			<TreeItem key={nodes.id} nodeId={nodes.id} label={nodes.name}>
				{Array.isArray(nodes.children)
					? nodes.children.map((node) => renderTree(node))
					: null}
			</TreeItem>
		);
	}

	return (
		<Box sx={{
			flexGrow: 1,
			overflowY: 'auto',
			mx: 2,
			position: 'relative',
		}}>
			<Box sx={{
				height: '100%',
				width: '100%',
				position: 'absolute',
				pb: 5
			}}>

				{isLoading ? (
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							height: '100%',
						}}
					>
						<CircularProgress />
					</Box>
				) : (
					<TreeView
						aria-label="rich object"
						defaultCollapseIcon={<ExpandMoreIcon />}
						defaultExpanded={['root']}
						defaultExpandIcon={<ChevronRightIcon />}
						sx={{ flexGrow: 1 }}

						expanded={expanded}
						selected={selected}
						onNodeToggle={handleToggle}
						onNodeSelect={handleSelect}
					>
						{renderTree(categories)}
					</TreeView>
				)}

			</Box>
		</Box>
	)
}

export default CategoryView;
