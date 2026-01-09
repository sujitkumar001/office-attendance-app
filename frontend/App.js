// App.js
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import EmployeeDashboard from './src/screens/EmployeeDashboard';
import ManagerDashboard from './src/screens/ManagerDashboard';
import AttendanceScreen from './src/screens/AttendanceScreen';
import DailyReportScreen from './src/screens/DailyReportScreen';
import ReportHistoryScreen from './src/screens/ReportHistoryScreen';
import AttendanceOverviewScreen from './src/screens/AttendanceOverviewScreen';
import AllReportsScreen from './src/screens/AllReportsScreen';
import TeamMembers from './src/screens/TeamMembers';
import EmployeeDetails from './src/screens/EmployeeDetails';

// Import Task screens
import EmployeeTasksScreen from './src/screens/EmployeeTasksScreen';
import ManagerTasksScreen from './src/screens/ManagerTasksScreen';
import CreateTaskScreen from './src/screens/CreateTaskScreen';
import TaskDetailScreen from './src/screens/TaskDetailScreen';

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  const { user } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {user?.role === 'manager' ? (
        <>
          <Stack.Screen name="ManagerDashboard" component={ManagerDashboard} />
          <Stack.Screen name="Attendance" component={AttendanceScreen} />
          <Stack.Screen name="DailyReport" component={DailyReportScreen} />
          <Stack.Screen name="ReportHistory" component={ReportHistoryScreen} />
          <Stack.Screen name="AttendanceOverview" component={AttendanceOverviewScreen} />
          <Stack.Screen name="AllReports" component={AllReportsScreen} />
          <Stack.Screen name="TeamMembers" component={TeamMembers} />
          <Stack.Screen name="EmployeeDetails" component={EmployeeDetails} />
          
          {/* Manager Task Screens */}
          <Stack.Screen 
            name="ManagerTasks" 
            component={ManagerTasksScreen}
            options={{
              headerShown: false,
              title: 'Task Management',
              headerStyle: {
                backgroundColor: '#007AFF',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
          <Stack.Screen 
            name="CreateTask" 
            component={CreateTaskScreen}
            options={{
              headerShown: false,
              title: 'Create Task',
              headerStyle: {
                backgroundColor: '#007AFF',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
          <Stack.Screen 
            name="TaskDetail" 
            component={TaskDetailScreen}
            options={{
              headerShown: false,
              title: 'Task Details',
              headerStyle: {
                backgroundColor: '#007AFF',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="EmployeeDashboard" component={EmployeeDashboard} />
          <Stack.Screen name="Attendance" component={AttendanceScreen} />
          <Stack.Screen name="DailyReport" component={DailyReportScreen} />
          <Stack.Screen name="ReportHistory" component={ReportHistoryScreen} />
          
          {/* Employee Task Screens */}
          <Stack.Screen 
            name="EmployeeTasks" 
            component={EmployeeTasksScreen}
            options={{
              headerShown: false,
              title: 'My Tasks',
              headerStyle: {
                backgroundColor: '#007AFF',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
          <Stack.Screen 
            name="TaskDetail" 
            component={TaskDetailScreen}
            options={{
              headerShown: false,
              title: 'Task Details',
              headerStyle: {
                backgroundColor: '#007AFF',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

function Navigation() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <Navigation />
      </AuthProvider>
    </PaperProvider>
  );
}