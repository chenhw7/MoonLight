import { Routes, Route } from 'react-router-dom'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function App() {
  return (
    <div className="min-h-screen">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <Routes>
        <Route 
          path="/" 
          element={
            <div className="min-h-screen flex items-center justify-center gradient-bg p-4">
              <Card className="w-full max-w-md animate-fade-in">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">🌙 MoonLight</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-center text-muted-foreground">
                    欢迎来到 MoonLight
                  </p>
                  <Button className="w-full">开始使用</Button>
                </CardContent>
              </Card>
            </div>
          } 
        />
        <Route path="/login" element={<div>Login Page (TODO)</div>} />
      </Routes>
    </div>
  )
}

export default App
