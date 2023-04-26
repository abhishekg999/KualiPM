import { Autocomplete, Box, CircularProgress, LinearProgress, Step, StepLabel, Stepper, Typography } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';

import { UserContext } from '../../contexts/UserContext';

import PropTypes from 'prop-types';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import _ from 'lodash';
import { getAllSubCategories, getAllUsersByQuery, giveUserAdminInGroup } from '../../util/kuali.mjs';

function LinearProgressWithLabel(props) {
	return (
		<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
			<Box sx={{ width: '100%', mr: 1 }}>
				<LinearProgress variant="determinate" {...props} />
			</Box>
			<Box sx={{ minWidth: 35 }}>
				<Typography variant="body2" color="text.secondary">{`${Math.round(
					props.value,
				)}%`}</Typography>
			</Box>
		</Box>
	);
}

LinearProgressWithLabel.propTypes = {
	/**
	 * The value of the progress indicator for the determinate and buffer variants.
	 * Value between 0 and 100.
	 */
	value: PropTypes.number.isRequired,
};

const AssignAdmin = () => {
	const { userContext, setUserContext } = useContext(UserContext);
	const [categories, setCategories] = useState(userContext.selected_categories);

	const [url, setUrl] = useState('');
	const [apiKey, setApiKey] = useState('')

	const [groupsToHandle, setGroupsToHandle] = useState([]);

	const [categoryGraph, setCategoryGraph] = useState(userContext.category_graph);
	const [groupMap, setGroupMap] = useState(userContext.group_graph);

	const [idToName, setIdToName] = useState(userContext.id_to_name);

	const [allAssociatedCategories, setAllAssociatedCategories] = useState([]);

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
			setGroupMap((prev) => userContext.group_graph);
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
			return;
		}

		const blueprintsToAdd = getAllSubCategories(categoryGraph, categories);
		setAllAssociatedCategories(() => blueprintsToAdd);

	}, [categories]);

	const getAllGroups = (category_array) => {
		let all_groups = [];
		category_array.forEach(el => {
			all_groups = all_groups.concat(groupMap[el]);
		});

		all_groups = _.compact(all_groups);

		return all_groups;

	}

	useEffect(() => {
		setGroupsToHandle(getAllGroups(allAssociatedCategories));
	}, [allAssociatedCategories])

	const [open, setOpen] = useState(false);

	const [selectedUser, setSelectedUser] = useState(null);
	const [options, setOptions] = useState([]);

	const handleClickOpen = () => {
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);

	};

	useEffect(() => {
		if (open === true) {
			return;
		}
		setProgessLogS([]);
		setProgessLogF([]);
		setProgress(0);
		setCountFinished(0);

		setActiveStep(0);
		setIsAssigningAdmin(false);
		setIsAssignAdminSuccess(false);

		setSelectedUser(null);
		setOptions([]);
		setProgessStatus("success");
	}, [open]);

	const queryUsers = async (s) => {
		let data = await getAllUsersByQuery(url, apiKey, s);
		data = JSON.parse(data);

		setOptions(() => data.data.usersConnection.edges);
	}

	const handleUserSelect = (_, value) => {
		setSelectedUser(() => value);
	};

	useEffect(() => {
		;
	}, [options])

	const steps = ['Select User', 'Confirm Selection', "Assign Admin", "Finished"];
	const [activeStep, setActiveStep] = useState(0);
	const [isAssigningAdmin, setIsAssigningAdmin] = useState(false);
	const [isAssignAdminSuccess, setIsAssignAdminSuccess] = useState(false);


	const handleNext = () => {
		setActiveStep((prevActiveStep) => prevActiveStep + 1);
	};

	const handleBack = () => {
		setActiveStep((prevActiveStep) => prevActiveStep - 1);
	};

	const handleSubmit = () => {
		handleClose()
	};

	const [progress, setProgress] = useState(0);
	const [countFinished, setCountFinished] = useState(0);
	const [progressStatus, setProgessStatus] = useState("success");
	const [progessLogS, setProgessLogS] = useState([]);
	const [progessLogF, setProgessLogF] = useState([]);


	useEffect(() => {
		setProgress(100 * countFinished / groupsToHandle.length);
	}, [countFinished, groupsToHandle]);

	const startAssignment = async () => {
		try {
			setIsAssigningAdmin(true);
			console.log("Beginning Assigning Admin");

			const promises = groupsToHandle.map((group, index) => {
				console.log("Giving admin to", selectedUser.node.id, group.node.id);
				return new Promise(resolve => {
					setTimeout(() => {
						giveUserAdminInGroup(url, apiKey, selectedUser.node.id, group.node.id).then((e) => {
							const resp = JSON.parse(e);
							console.log(resp);
							setCountFinished((prev) => prev + 1);

							if (Object.keys(resp).includes("errors")) {
								console.log("Error in assignment...");
								setProgessStatus("error");
								setProgessLogF((p) => [...p, `${group.node.name} Error in Assignment`]);
							} else {
								if (resp.data?.addGroupRoleUser.result.memberIds === null) {
									setProgessLogS((p) => [...p, `${group.node.name} already Admin`]);
								} else if (resp.data?.addGroupRoleUser.result.memberIds?.includes(selectedUser.node.id)) {
									setProgessLogS((p) => [...p, `${group.node.name} added Admin`]);
								} else {
									setProgessLogF((p) => [...p, `${group.node.name} Error in Assignment`]);
								}
							}

							resolve();
						})
					}, 200 * index);
				})
			});

			await Promise.all(promises);
			setIsAssignAdminSuccess(true);

		} catch (error) {
			console.error("Error Assigning Admin:", error);
			setProgessStatus("error");
		} finally {
			setIsAssigningAdmin(false);
		}
	};

	const getStepContent = (step) => {
		switch (step) {
			case 0:
				return (
					<>
						<DialogContentText sx={{
							pb: 1
						}}>
							Select the user to add as Admin.
						</DialogContentText>
						<Autocomplete
							freeSolo
							filterOptions={() => options}
							options={options}
							getOptionLabel={(option) => option.node.label}
							renderOption={(props, option) => {
								return (
									<li {...props} key={option.node.id}>
										{option.node.label}
									</li>
								);
							}}
							onChange={handleUserSelect}
							onInputChange={(e, n) => {
								if (n) {
									if (n.length < 3) {
										return;
									}
									queryUsers(n);
								} else {
									setOptions(() => []);
								}
							}}
							value={selectedUser}
							renderInput={(params) => {
								return (
									<TextField {...params} autoComplete='off' />
								)
							}}
						/>

						{selectedUser ? (
							<Box
								sx={{
									border: '1px solid #ccc',
									borderRadius: 1,
									p: 2,
									mt: 2
								}}
							>
								<Typography variant="body1">
									Name: {selectedUser.node.label}
								</Typography>
								<Typography variant="body1">
									Username: {selectedUser.node.username}
								</Typography>
								<Typography variant="body1">
									Email: {selectedUser.node.email}
								</Typography>
							</Box>
						) : (
							<></>
						)}
					</>
				);
			case 1:
				return (
					<Box sx={{ p: 2 }}>
						<Typography variant="subtitle1" color="error" sx={{ mb: 2 }}>
							Please ensure the following information is correct.
						</Typography>

						<Box
							sx={{
								border: '1px solid #ccc',
								borderRadius: 1,
								p: 2,
							}}
						>
							<Typography variant="body1">
								Name: {selectedUser.node.label}
							</Typography>
							<Typography variant="body1">
								Username: {selectedUser.node.username}
							</Typography>
							<Typography variant="body1">
								Email: {selectedUser.node.email}
							</Typography>
						</Box>

						<Box
							sx={{
								mt: 2,
								border: '1px solid #ccc',
								borderRadius: 1,
								p: 2,
								bgcolor: '#222',
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'center',
								alignItems: 'left',
							}}
						>
							<Typography variant="body1">
								{console.log(allAssociatedCategories)}
								{`Admin will be given to ${allAssociatedCategories.length} categories and ${groupsToHandle.length} groups.`}
							</Typography>

							<Box
								sx={{
									maxHeight: 200,
									overflowY: 'auto',
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'flex-start',
								}}
							>

								<ol type='1'>
									{groupsToHandle.map((el, index) => (
										<li key={el.node.id}>
											<Typography variant="body1">
												{`${el.node.name}`}
											</Typography>
										</li>
									))}
								</ol>
							</Box>
						</Box>
					</Box>
				);
			case 2:
				return (
					<Box sx={{ mt: 2 }}>
						<Box
							sx={{
								mt: 2,
								pl: 2,
								pr: 2,
								pt: 1,
								pb: 1,
								border: '1px solid #ccc',
								borderRadius: 1,
								bgcolor: '#222',
								display: 'flex',
								flexDirection: 'column',
							}}
						>
							<Box
								sx={{
									maxHeight: 400,
									overflowY: 'auto',
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'flex-start',
									position: 'relative',
									width: '100%'
								}} id="here"
							>
								<LinearProgressWithLabel value={progress} color={progressStatus}></LinearProgressWithLabel>
							</Box>
						</Box>


						<Button
							variant="contained"
							color="primary"
							disabled={isAssigningAdmin || isAssignAdminSuccess}
							onClick={startAssignment}
							sx={{ mt: 2 }}
						>
							{isAssigningAdmin ? (
								<CircularProgress size={24} sx={{ color: 'common.white' }} />
							) : (
								'Start'
							)}
						</Button>
					</Box>
				)
			case 3:
				return (
					<Box sx={{ mt: 2 }}>
						<Typography variant="body1">
							{console.log(allAssociatedCategories)}
							{`${selectedUser.node.displayName} assigned Admin in ${progessLogS.length} groups.`}
						</Typography>
						<Box
							sx={{
								mt: 2,
								pl: 2,
								pr: 2,
								pt: 1,
								pb: 1,
								border: '1px solid #ccc',
								borderRadius: 1,
								bgcolor: '#222',
								display: 'flex',
								flexDirection: 'column',
							}}
						>

							<ol type='1'>
								{progessLogS.map((el, index) => (
									<li key={index}>
										<Typography variant="body1" color="green">
											{`${el}`}
										</Typography>
									</li>
								))}
								{progessLogF.map((el, index) => (
									<li key={index}>
										<Typography variant="body1" color="red">
											{`${el}`}
										</Typography>
									</li>
								))}
							</ol>

						</Box>

					</Box>
				)
			default:
				return <p>Something went wrong</p>;
		}
	};

	return <Box sx={{
		flexGrow: 1,
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		height: '100%'
	}}>
		<Dialog open={open} onClose={handleClose}>
			<DialogTitle>Assign Admin</DialogTitle>
			<DialogContent sx={{
				pb: 1
			}}>
				<Stepper activeStep={activeStep}>
					{steps.map((label) => (
						<Step key={label}>
							<StepLabel>{label}</StepLabel>
						</Step>
					))}
				</Stepper>

				<Box sx={{
					pt: 2,
					pb: 1
				}}>
					{getStepContent(activeStep)}
				</Box>


			</DialogContent>
			<DialogActions>
				{activeStep === 1 && (
					<Button onClick={handleBack}>Back</Button>
				)}
				{activeStep !== steps.length - 1 ? (
					<Button variant="contained" color="primary" onClick={handleNext} disabled={!selectedUser || (activeStep === 2 && !isAssignAdminSuccess)}>
						Next
					</Button>
				) : (
					<Button variant="contained" color="primary" onClick={handleSubmit}>
						Finish
					</Button>
				)}
			</DialogActions>
		</Dialog>

		<Button
			variant='outlined'
			startIcon={<AdminPanelSettingsIcon />}
			onClick={handleClickOpen}
		>
			Add Admin
		</Button>
	</Box>
}

export default AssignAdmin;
