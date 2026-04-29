import {
  //  GithubAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import app from "../../firebase/firebase.init";
import { useState } from "react";

const Login = () => {
  const [user, setUser] = useState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();
  // const githubProvider = new GithubAuthProvider();

  const getReadableAuthError = (error) => {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "That email is already registered. Try logging in instead.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "The email or password is incorrect.";
      case "auth/user-not-found":
        return "No account was found for that email address.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/missing-password":
        return "Please enter your password.";
      case "auth/operation-not-allowed":
        return "Email/password sign-in is not enabled for this Firebase project.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait a moment and try again.";
      default:
        return error.message || "Authentication failed. Please try again.";
    }
  };

  const saveLoggedInUser = async (loggedInUser) => {
    const token = await loggedInUser.getIdToken(true);
    localStorage.setItem("token", token);
    setUser(loggedInUser);
  };

  const handleEmailRegister = async () => {
    setAuthError("");

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await saveLoggedInUser(result.user);
    } catch (error) {
      setAuthError(getReadableAuthError(error));
    }
  };

  const handleEmailLogin = async () => {
    setAuthError("");

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await saveLoggedInUser(result.user);
    } catch (error) {
      setAuthError(getReadableAuthError(error));
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const loggedInUser = result.user;
      console.log("User:", loggedInUser);

      await saveLoggedInUser(loggedInUser);
    } catch (error) {
      console.error("Error during sign-in:", error.message);
      setAuthError(getReadableAuthError(error));
    }
  };

  // const handleGithubSignIn = () => {
  //   signInWithPopup(auth, githubProvider)
  //     .then((result) => {
  //       const loggedInUser = result.user;
  //       console.log(loggedInUser);
  //       setUser(loggedInUser);
  //     })
  //     .catch((error) => {
  //       console.log("error", error.message);
  //     });
  // };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log("User Signed out successfully!");
      localStorage.removeItem("token");
      setUser(null);
    } catch (error) {
      console.log("error", error.message);
    }
  };

  const fetchSecureData = async () => {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        console.log("No user is signed in.");
        return;
      }

      const token = await currentUser.getIdToken(true);

      localStorage.setItem("token", token);

      const response = await fetch("http://localhost:5001/secure-data", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Secure data:", data);
      } else {
        console.log("Failed to fetch secure data:", response.status);
      }
    } catch (error) {
      console.log("Error fetching secure data:", error.message);
    }
  };

  return (
    <div>
      {user ? (
        <>
          <button onClick={handleSignOut}>Sign Out</button>
          <button onClick={fetchSecureData}>Fetch Secure Data</button>
        </>
      ) : (
        <div className="login-form">
          <div className="login-form">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
            />
            <button onClick={handleEmailRegister}>
              Register with Email/Password
            </button>
            <button onClick={handleEmailLogin}>Login with Email/Password</button>
          </div>
          {authError && <p role="alert">{authError}</p>}
          <button onClick={handleGoogleSignIn}>Google Login</button>
          {/* <button onClick={handleGithubSignIn}>Github Login</button> */}
        </div>
      )}
      {user && (
        <div>
          <h3>User: {user.displayName || user.email}</h3>
          <p>Email: {user.email}</p>
        </div>
      )}
    </div>
  );
};

export default Login;
