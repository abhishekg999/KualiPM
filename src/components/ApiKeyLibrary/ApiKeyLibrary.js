import { Box } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';

import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';

import { UserContext } from '../../contexts/UserContext';

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

const ApiKeyLibrary = () => {
	const { userContext, setUserContext } = useContext(UserContext);
	const [key, setKey] = useState(userContext.api_key);
	const [storedKeys, setStoredKeys] = useState(userContext.stored_api_keys);

	const handleChange = (event) => {
		setKey((prev) => event.target.value);
	};

	useEffect(() => {
		setKey((prev) => userContext.api_key);
		setStoredKeys((prev) => userContext.stored_api_keys);
	}, [userContext]);

	useEffect(() => {
		setUserContext((prev) => {
			return {...prev, api_key: key}
		})
	}, [key])


	const [p_name, p_setName] = useState("");
	const [p_apiKey, p_setApiKey] = useState("");

	const [open, setOpen] = React.useState(false);
	const handleClickOpen = () => {
		setOpen(true);
	};
	const handleClose = () => {
		setOpen(false);
	};

	const handleAdd = () => {
		const new_obj = {
			id: p_apiKey,
			name: p_name,
		}

		console.log(userContext)
		userContext.stored_api_keys.push(new_obj)

		setUserContext((prev) => {
			return { ...prev, stored_api_keys: userContext.stored_api_keys }
		})

		p_setName(() => "");
		p_setApiKey(() => "");

		setOpen(false);
	}


	return (
		<Box sx={{
			flexGrow: 1,
			display: "flex",
			justifyContent: "left",
			alignItems: "center",
		}}>

			<Dialog open={open} onClose={handleClose}>
				<DialogTitle>Add API Key</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Enter the name and API key you want to load.
					</DialogContentText>
					<TextField
						autoFocus
						margin="dense"
						id="name"
						label="Name"
						type="text"
						fullWidth
						variant="standard"
						value={p_name}
						onChange={(event) => p_setName((prev) => event.target.value)}
						required
					/>
					<TextField
						margin="dense"
						id="key"
						label="Api Key"
						type="text"
						fullWidth
						variant="standard"
						value={p_apiKey}
						onChange={(event) => p_setApiKey((prev) => event.target.value)}
						required
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose}>Cancel</Button>
					<Button onClick={handleAdd} disabled={!p_name || !p_apiKey}>Add</Button>
				</DialogActions>
			</Dialog>

			<Box mr={3}>
				<IconButton onClick={handleClickOpen}>
					<AddIcon></AddIcon>
				</IconButton>
			</Box>


			<FormControl sx={{ minWidth: '30ch' }}>
				<InputLabel id="simple-select-label">Api Key</InputLabel>
				<Select
					labelId="simple-select-label"
					id="simple-select"
					value={key}
					label="Api Key"
					onChange={handleChange}
				>

					{(storedKeys.length > 0) ?
						storedKeys.map((obj) => (
							<MenuItem
								key={obj.id}
								value={obj.id}
							>
								{obj.name}
							</MenuItem>
						)) :
						<MenuItem disabled value="">
							<em>No Api Keys Available</em>
						</MenuItem>
					}

				</Select>
			</FormControl>

		</Box>
	)
}

export default ApiKeyLibrary;
