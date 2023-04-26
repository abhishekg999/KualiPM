import { Box } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import { UserContext } from '../../contexts/UserContext';

function UrlBar() {
	const [subDomain, setSubDomain] = useState("");

	const { userContext, setUserContext } = useContext(UserContext);

	useEffect(() => {
		if (userContext.subdomain) {
			setSubDomain((prev) => userContext.subdomain);
		}
	}, [userContext]);

	const handleClick = (e) => {
		setUserContext((prevContext) => {
			return { ...prevContext, subdomain: subDomain }
		});
	}

	const handleChange = (e) => {
		setSubDomain((prev) => e.target.value);
	}

	return (
		<Box sx={{
			flexGrow: 1,
			display: "flex",
			justifyContent: "right",
			alignItems: "center",
		}}>

			<TextField
				id="subdomain"
				sx={{
					m: 3,
					width: '25ch',
				}}
				InputProps={{
					endAdornment: (
						<InputAdornment disableTypography position="end">
							.kualibuild.com
						</InputAdornment>
					)

				}}
				variant="standard"
				value={subDomain}
				onChange={handleChange}

				autoComplete='off'
			/>

			<IconButton onClick={handleClick}>
				<SearchIcon></SearchIcon>
			</IconButton>

		</Box>
	)
}

export default UrlBar;
