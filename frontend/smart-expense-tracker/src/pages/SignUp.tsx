import { Grid, Input, InputLabel, FormControl, Button, Card, InputAdornment, IconButton, Typography, Box } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LockIcon from '@mui/icons-material/Lock';
import { useState } from 'react';
import logo from "../assets/logo.png"
import { useNavigate } from 'react-router-dom';
import axios from 'axios'
// var logo = "../assets/logo.png"
function SignUp() {
    const navigate = useNavigate()
    const [email,setEmail] = useState("")
    const [password,setPassword] = useState("")
    const [error, setError] = useState(null);
    function HandleEmailChange (event){
        setEmail(event.target.value)
    }
    const HandlePasswordChange = (event) => {
        setPassword(event.target.value)
    }

    async function HandleSubmit() {
        const formData = { email, password };
        try {
            const response = await axios.post("http://localhost:8000/auth/signup", formData);
            console.log(response);
            // Optionally: navigate("/login") or show success
        } catch (error) {
            setError(error);
        }
    }
        
    
  return (
    <Card  sx={{ width: 450, height:570, margin: '2rem auto', padding: 2, borderRadius: 12 }}>

    
        <Grid
        container
        direction="column"
        spacing={3}
        sx={{
            padding: 4,
            maxWidth: 400,
            margin: '0 auto',
            justifyContent: "center",
            alignItems: "stretch",
            height : "100%"
        }}
        >
            <Grid item sx={{ textAlign: 'Center' }}>
                <Box
                    component="img"
                    src={logo}
                    alt="App Logo"
                    sx={{
                    height: 80,
                    mb: 2,
                    }}
                />
            </Grid>
                <Grid item>
                    <FormControl fullWidth variant="standard">
                    <InputLabel htmlFor="email-input">Email address</InputLabel>
                    <Input
                        id="input-with-icon-adornment"
                        startAdornment={
                            <InputAdornment position="start">
                                <MailOutlineIcon />
                            </InputAdornment>
                        }
                        onChange={HandleEmailChange}
                    />
                    </FormControl>
                </Grid>

                <Grid item>
                    <FormControl fullWidth variant="standard">
                    <InputLabel htmlFor="password-input">Password</InputLabel>
                    <Input
                        id="input-with-icon-adornment"
                        startAdornment={
                            <InputAdornment position="start">
                                <LockIcon />
                            </InputAdornment>
                        }
                        onChange={HandlePasswordChange}
                    />
                    </FormControl>
                </Grid>


                <Grid item>
                    <Grid container spacing={2} justifyContent="center">
                    </Grid>
                </Grid>

                <Grid item>
                    <Button 
                        fullWidth 
                        variant="contained" 
                        color="secondary" 
                        sx={{ mt: 1 ,borderRadius: 12, height:"50px",fontSize:"16px" }}
                        onClick={()=>{HandleSubmit(email,password)}}
                    >
                        Sign Up
                    </Button>

                </Grid>
        </Grid>
    </Card>
  );
}
export default SignUp