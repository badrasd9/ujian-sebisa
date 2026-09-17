/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Login from './Login';
import Exam from './Exam';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [credentials, setCredentials] = useState<{nis: string, token: string} | null>(null);

  const handleLoginSuccess = (data: any, creds: {nis: string, token: string}) => {
    setStudentData(data);
    setCredentials(creds);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setStudentData(null);
    setCredentials(null);
    // Remove fullscreen on logout
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.warn(err));
    }
  };

  return (
    <>
      {!isLoggedIn || !credentials ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Exam 
          studentData={studentData} 
          credentials={credentials} 
          onLogout={handleLogout} 
        />
      )}
    </>
  );
}
