//You can modify this component.

import { useRef, useState } from "react";
import { useUser } from "../contexts/UserProvider";
import { Navigate } from "react-router-dom";

export default function Login() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [controlState, setControlState] = useState({
    isLoggingIn: false,
    isLoginError: false,
    isLoginOk: false
  });

  const emailRef = useRef();
  const passRef = useRef();
  const { user, login } = useUser();

  function fillAdmin() {
    emailRef.current.value = "admin@test.com";
    passRef.current.value = "admin123";
  }

  function fillUser() {
    emailRef.current.value = "user@test.com";
    passRef.current.value = "user123";
  }

  async function onLogin() {
    setControlState((prev) => ({
      ...prev,
      isLoggingIn: true
    }));

    const email = emailRef.current.value;
    const pass = passRef.current.value;

    const result = await login(email, pass);

    setControlState({
      isLoggingIn: false,
      isLoginError: !result,
      isLoginOk: result
    });
  }

  if (!user.isLoggedIn)
    return (
      <div className='login-wrap'>
        <div className='panel login-panel'>
          <h2>Welcome Back</h2>
          <p className='meta-line'>Backend: {API_URL}</p>

          <div className='form-grid'>
            <label htmlFor='email'>Email</label>
            <input type="text" name="email" id="email" ref={emailRef} />
            <label htmlFor='password'>Password</label>
            <input type="password" name="password" id="password" ref={passRef} />
          </div>

          <div className='row-actions'>
            <button className='ghost' type="button" onClick={fillAdmin}>Use Admin Test User</button>
            <button className='ghost' type="button" onClick={fillUser}>Use User Test User</button>
          </div>

          <button className='cta' onClick={onLogin} disabled={controlState.isLoggingIn}>
            {controlState.isLoggingIn ? 'Signing In...' : 'Login'}
          </button>
          {controlState.isLoginError && <div className='alert error'>Login incorrect</div>}
          {controlState.isLoginOk && <div className='alert ok'>Login success</div>}
        </div>
      </div>
    );

  return <Navigate to="/books" replace />;
}
