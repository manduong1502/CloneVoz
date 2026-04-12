import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Category from './pages/Category';
import ThreadDetail from './pages/ThreadDetail';
import Profile from './pages/Profile';
import GlobalChat from './components/chat/GlobalChat';
import './App.css'; // We can remove this later, using index.css

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:id" element={<Category />} />
          <Route path="/thread/:id" element={<ThreadDetail />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </MainLayout>
      <GlobalChat />
    </BrowserRouter>
  );
}

export default App;
