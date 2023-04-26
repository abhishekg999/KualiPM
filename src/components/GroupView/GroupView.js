import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { Box, Skeleton } from '@mui/material';

import { getAllGroups, getAllSubCategories, JSONGroupsToCategoryMap } from '../../util/kuali.mjs';
import CircularProgress from '@mui/material/CircularProgress';

import _ from 'lodash';

import TreeView from '@mui/lab/TreeView';
import TreeItem from '@mui/lab/TreeItem';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';




function GroupView() {
	const { userContext, setUserContext } = useContext(UserContext);
	const [categories, setCategories] = useState(userContext.selected_categories);

	const [url, setUrl] = useState('');
	const [apiKey, setApiKey] = useState('')

	const [groups, setGroups] = useState({});
	const [categoryGraph, setCategoryGraph] = useState(userContext.category_graph);
	const [graph, setGraph] = useState(userContext.group_graph);
	const [idToName, setIdToName] = useState(userContext.id_to_name);

	const [allAssociatedCategories, setAllAssociatedCategories] = useState([]);

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

		if (userContext.id_to_name) {
			setIdToName((prev) => userContext.id_to_name);
		}

		if (userContext.category_graph) {
			setCategoryGraph((prev) => userContext.category_graph);
		}

		if (userContext.group_graph) {
			setGraph((prev) => userContext.group_graph);
		}

		if (userContext.selected_categories) {
			setCategories(() => userContext.selected_categories);
		}
	}, [userContext]);


	useEffect(() => {
		if (!categoryGraph || _.isEmpty(categoryGraph) || !categories || _.isEmpty(categories)) {
			return;
		}

		if (categories === 'root') {
			setAllAssociatedCategories(() => Object.keys(categoryGraph));
			console.log(Object.keys(categoryGraph).length)
			return;
		}

		const blueprintsToAdd = getAllSubCategories(categoryGraph, categories);
		console.log(blueprintsToAdd.length);
		setAllAssociatedCategories(() => blueprintsToAdd);

	}, [categories, graph]);


	useEffect(() => {
		if (!url || !apiKey) {
			return;
		}
		const handleNewUrl = async () => {
			try {
				const raw_data = await getAllGroups(url, apiKey, 100);
				const map = JSONGroupsToCategoryMap(raw_data);

				setGraph((prev) => map);
			} catch (e) {
				console.log(e);
				setGraph(() => {});
			} finally {
				setIsLoading(() => false);
			}

		};

		setIsLoading(() => true);
		handleNewUrl();
	}, [url, apiKey])



	useEffect(() => {
		setUserContext((prev) => {
			return { ...prev, group_graph: graph }
		})
	}, [graph])


	const renderTree = (categories, graph) => {
		if (!graph || _.isEmpty(graph)) {
			return
		}

		const renderCategory = (category) => {
			const groups = graph[category] || [];

			return (
				<TreeItem key={category} nodeId={category} label={idToName[category]}>
					{groups.map((group) => (
						<TreeItem key={group.node.id} nodeId={group.node.id} label={group.node.name} />
					))}
				</TreeItem>
			);
		};

		return categories.map((category) => renderCategory(category));
	};


	const [expanded, setExpanded] = React.useState(['root']);
	const [selected, setSelected] = React.useState([]);

	const handleToggle = (event, nodeIds) => {
		setExpanded(nodeIds);
	};

	const handleSelect = (event, nodeIds) => {
		setSelected(nodeIds);
	};


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
						{renderTree(allAssociatedCategories, graph)}
					</TreeView>
				)}
			</Box>
		</Box>
	)
}

export default GroupView;
