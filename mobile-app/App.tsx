import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import PushNotification from 'react-native-push-notification';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tela de Dashboard
const DashboardScreen = ({ navigation }: any) => {
  const [stats, setStats] = useState({ assets: 0, alerts: 0, logs: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [assets, alerts, logs] = await Promise.all([
        axios.get('http://localhost:8080/api/assets'),
        axios.get('http://localhost:8080/api/alerts'),
        axios.get('http://localhost:8080/api/security/logs/stats')
      ]);
      
      setStats({
        assets: assets.data.total || 0,
        alerts: alerts.data.total || 0,
        logs: logs.data.total_logs_24h || 0
      });
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1D4ED8" />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.scrollView}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🛡️ CKAEW Sentinel</Text>
          <Text style={styles.headerSubtitle}>Monitoramento em Tempo Real</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="server-outline" size={30} color="#3B82F6" />
            <Text style={styles.statNumber}>{stats.assets}</Text>
            <Text style={styles.statLabel}>Ativos</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="alert-circle-outline" size={30} color="#EF4444" />
            <Text style={styles.statNumber}>{stats.alerts}</Text>
            <Text style={styles.statLabel}>Alertas</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="document-text-outline" size={30} color="#10B981" />
            <Text style={styles.statNumber}>{stats.logs}</Text>
            <Text style={styles.statLabel}>Logs (24h)</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.incidentButton}
          onPress={() => navigation.navigate('Incidentes')}
        >
          <Text style={styles.incidentButtonText}>🚨 Ver Incidentes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// Tela de Incidentes
const IncidentesScreen = () => {
  const [incidentes, setIncidentes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidentes();
  }, []);

  const fetchIncidentes = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/alerts');
      setIncidentes(response.data.alerts || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚨 Incidentes</Text>
        <Text style={styles.headerSubtitle}>Alertas de segurança</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        {loading ? (
          <Text style={styles.loadingText}>Carregando...</Text>
        ) : incidentes.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum incidente encontrado</Text>
        ) : (
          incidentes.map((item: any, index) => (
            <View key={index} style={styles.incidentCard}>
              <View style={styles.incidentHeader}>
                <Text style={styles.incidentTitle}>{item.title}</Text>
                <View style={[
                  styles.priorityBadge,
                  { backgroundColor: item.priority === 'critical' ? '#EF4444' : '#F59E0B' }
                ]}>
                  <Text style={styles.priorityText}>{item.priority}</Text>
                </View>
              </View>
              <Text style={styles.incidentSource}>📍 {item.source_ip || 'N/A'}</Text>
              <Text style={styles.incidentDate}>
                {new Date(item.created_at).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Configuração de Navegação
const App = () => {
  useEffect(() => {
    // Configurar notificações push
    PushNotification.configure({
      onNotification: function(notification) {
        console.log('NOTIFICAÇÃO:', notification);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: true,
    });

    // Agendar notificação de teste
    PushNotification.localNotificationSchedule({
      message: "📊 Relatório Diário de Segurança",
      date: new Date(Date.now() + 60 * 1000),
      repeatType: 'day',
    });
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: string = 'home-outline';
            if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
            else if (route.name === 'Incidentes') iconName = focused ? 'alert-circle' : 'alert-circle-outline';
            else if (route.name === 'Configurações') iconName = focused ? 'settings' : 'settings-outline';
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2563EB',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Incidentes" component={IncidentesScreen} />
        <Tab.Screen name="Configurações" component={DashboardScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#1D4ED8',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#93C5FD',
    marginTop: 5,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  incidentButton: {
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 16,
  },
  incidentButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  incidentCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incidentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  incidentSource: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  incidentDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#6B7280',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#6B7280',
    fontSize: 16,
  },
});

export default App;
