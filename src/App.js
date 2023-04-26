import './App.css';
import { Box } from '@mui/material';
import UrlBar from './components/UrlBar/UrlBar';
import { UserContextProvider } from './contexts/UserContext.js';
import CategoryView from './components/CategoryView/CategoryView';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ApiKeyLibrary from './components/ApiKeyLibrary/ApiKeyLibrary';
import GroupView from './components/GroupView/GroupView';
import AssignAdmin from './components/AssignAdmin/AssignAdmin';

const darkTheme = createTheme({
	palette: {
		mode: 'dark',
	},
});

function App() {
	return (
		<ThemeProvider theme={darkTheme}>
			<CssBaseline>
				<UserContextProvider>
					<Box id="asdf" sx={{
						display: 'flex',
						flexDirection: 'column',
						width: '100%',
						height: '100%'
					}}>
						<Box sx={{
							flexGrow: 0,
							display: 'flex',
							justifyContent: 'space-between',
							pl: 5,
							pr: 5,
							borderBottom: "1px solid white"
						}}>
							<ApiKeyLibrary></ApiKeyLibrary>
							<UrlBar></UrlBar>
						</Box>

						<Box sx={{
							width: "100%",
							height: "100%",
							flexGrow: 1,
							display: "flex",
							flexDirection: "row",
							gap: "10px",
							mt: 2,
							mb: 2,
						}}>

							<Box sx={{
								height: '100%',
								maxWidth: '50%',
								flexGrow: 1,
								display: 'flex'
							}}>
								<CategoryView></CategoryView>
							</Box>


							<Box sx={{
								height: '100%',
								maxWidth: '50%',
								flexGrow: 1,
								display: 'flex'
							}}>

								<GroupView></GroupView>
							</Box>
						</Box>

						<Box sx={{
							height: "100px",
							width: "100%",
							flexGrow: 0,
							borderTop: "1px solid white"
						}}>

							<AssignAdmin></AssignAdmin>

						</Box>
					</Box>


				</UserContextProvider>
			</CssBaseline>
		</ThemeProvider>

	);
}

export default App;
