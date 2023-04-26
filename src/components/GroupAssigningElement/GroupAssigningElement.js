import { useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import CheckIcon from '@mui/icons-material/Check';
import { IconButton, Typography } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';

const GroupAssigningElement = ({ group }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [isCompleted, setIsCompleted] = useState(false);

	const handleAssignAdmin = async () => {
		setIsLoading(true);

		try {
			//const admins = await assignAdminToGroup(userId, group.node.id);
			const admins = ['asf'];
			setIsCompleted(true);
			console.log(admins); // replace this with whatever you want to do with the admins
		} catch (error) {
			console.log(error);
		}

		setIsLoading(false);
	};

	return (
		<li key={group.node.id} style={{ display: 'flex', alignItems: 'center' }}>
			<Typography variant="body1" style={{ flexGrow: 1 }}>
				{group.node.name}
			</Typography>
			{isLoading ? (
				<CircularProgress size={20} />
			) : (
				<IconButton onClick={handleAssignAdmin}>
					{isCompleted ? <CheckIcon color="success" /> : <PlayArrow />}
				</IconButton>
			)}
		</li>
	);
};

export default GroupAssigningElement;
