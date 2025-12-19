import { useState, useEffect } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonList, IonItem, IonLabel, IonIcon, IonText, IonBadge,
  IonItemSliding, IonItemOptions, IonItemOption, useIonViewWillEnter, IonButton
} from '@ionic/react';
import { alarmOutline, timerOutline, trashOutline, alertCircleOutline, notificationsOutline } from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';
import { LocalNotifications } from '@capacitor/local-notifications';

interface Tarea {
  id: number;
  titulo: string;
  tipo: 'recordatorio' | 'temporizador';
  fechaHora?: string;
  minutos?: number;
  completada: boolean;
  tiempoInicio?: number;
}

const Tab3: React.FC = () => {
  const [tareas, setTareas] = useState<Tarea[]>([]);

  const cargarTareas = async () => {
    const { value } = await Preferences.get({ key: 'tareas' });
    const tareasGuardadas: Tarea[] = value ? JSON.parse(value) : [];

    const tareasActualizadas = tareasGuardadas.map(t => {
      if (t.tipo === 'temporizador' && !t.tiempoInicio && !t.completada) {
        return { ...t, tiempoInicio: Date.now() };
      }
      return t;
    });

    setTareas(tareasActualizadas);
    await Preferences.set({ key: 'tareas', value: JSON.stringify(tareasActualizadas) });
  };

  useEffect(() => {
    cargarTareas();
  }, []);

      // Crea el channel al cargar la tab
    crearChannelAltaPrioridad();
  }, []);

  const crearChannelAltaPrioridad = async () => {
    await LocalNotifications.createChannel({
      id: 'neon-high',
      name: 'Neon Focus Alta Prioridad',
      importance: 5,
      sound: 'default',
      visibility: 1,
      lights: true,
      vibration: true
    });
  };

  useIonViewWillEnter(() => {
    cargarTareas();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTareas(prev => {
        const actualizadas = prev.map(t => {
          if (t.tipo === 'temporizador' && t.minutos && t.tiempoInicio && !t.completada) {
            const transcurridoSegundos = Math.floor((Date.now() - t.tiempoInicio) / 1000);
            const totalSegundos = t.minutos * 60;
            const restantes = totalSegundos - transcurridoSegundos;

            if (restantes <= 0) {
              return { ...t, completada: true };
            }
            return t;
          }
          return t;
        });

        if (JSON.stringify(prev) !== JSON.stringify(actualizadas)) {
          Preferences.set({ key: 'tareas', value: JSON.stringify(actualizadas) });
        }

        return actualizadas;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleCompletada = async (id: number) => {
    const nuevas = tareas.map(t => t.id === id ? { ...t, completada: !t.completada } : t);
    setTareas(nuevas);
    await Preferences.set({ key: 'tareas', value: JSON.stringify(nuevas) });
  };

  const borrarTarea = async (id: number) => {
    const nuevas = tareas.filter(t => t.id !== id);
    setTareas(nuevas);
    await Preferences.set({ key: 'tareas', value: JSON.stringify(nuevas) });
  };

  const probarNotificacionTarea = async (tarea: Tarea) => {
    await LocalNotifications.requestPermissions();

    await LocalNotifications.createChannel({
      id: 'neon-high',
      name: 'Neon Focus Alta Prioridad',
      importance: 5,
      sound: 'default',
      visibility: 1,
      vibration: true
    });

    await LocalNotifications.schedule({
      notifications: [{
        id: tarea.id + 200000,
        title: tarea.tipo === 'recordatorio' ? '🔔 Recordatorio de prueba' : '⏰ Temporizador de prueba',
        body: tarea.titulo,
        schedule: { at: new Date(Date.now() + 2000) },
        sound: 'default',
        channelId: 'neon-high'
      }]
    });
  };

  const formatoTiempoRestante = (tarea: Tarea) => {
    if (tarea.tipo === 'recordatorio' && tarea.fechaHora) {
      const fecha = new Date(tarea.fechaHora);
      const ahora = new Date();
      const diff = fecha.getTime() - ahora.getTime();
      if (diff <= 0) return 'Vencido';

      const horas = Math.floor(diff / (1000 * 60 * 60));
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const tiempoAprox = horas > 0 ? `${horas}h ${minutos}min` : `${minutos}min`;

      return `Faltan ${tiempoAprox} - ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    }

    if (tarea.tipo === 'temporizador' && tarea.minutos && tarea.tiempoInicio && !tarea.completada) {
      const transcurridoSegundos = Math.floor((Date.now() - tarea.tiempoInicio) / 1000);
      const totalSegundos = tarea.minutos * 60;
      let restantes = totalSegundos - transcurridoSegundos;

      if (restantes < 0) restantes = 0;

      const min = Math.floor(restantes / 60);
      const seg = restantes % 60;
      const countdown = `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;

      const final = new Date(Date.now() + restantes * 1000);
      const horaFinal = final.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

      return `${countdown} - Termina aprox. ${horaFinal}`;
    }

    return tarea.minutos ? `${tarea.minutos} min` : '';
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Mis Tareas</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="neon-content">
        <div className="background-glow" />
        <IonList className="ion-padding">
          {tareas.length === 0 ? (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              opacity: 0.6
            }}>
              <IonText color="medium">
                <h3>Sin tareas aún</h3>
                <p>¡Crea una en Recordatorios!</p>
              </IonText>
            </div>
          ) : (
            tareas.map((tarea) => (
              <IonItemSliding key={tarea.id}>
                <IonItem
                  className="neon-item"
                  style={{
                    opacity: tarea.completada ? 0.6 : 1,
                    textDecoration: tarea.completada ? 'line-through' : 'none'
                  }}
                >
                  <IonIcon
                    icon={
                      tarea.tipo === 'recordatorio' ? alarmOutline :
                      tarea.completada ? timerOutline :
                      alertCircleOutline
                    }
                    slot="start"
                    color={tarea.completada ? 'medium' : 'primary'}
                  />
                  <IonLabel onClick={() => toggleCompletada(tarea.id)}>
                    <h2 style={{ fontWeight: tarea.completada ? 'normal' : '500' }}>
                      {tarea.titulo}
                    </h2>
                    <p style={{ fontSize: '1.1rem', color: tarea.completada ? '#666' : '#90e0ef' }}>
                      {formatoTiempoRestante(tarea)}
                      {tarea.completada && tarea.tipo === 'temporizador' && ' - ¡Terminado!'}
                    </p>
                  </IonLabel>
                  <IonButton slot="end" fill="clear" color="medium" onClick={() => probarNotificacionTarea(tarea)}>
                    <IonIcon icon={notificationsOutline} />
                  </IonButton>
                  {tarea.completada && <IonBadge color="secondary" slot="end">Listo</IonBadge>}
                </IonItem>
                <IonItemOptions side="end">
                  <IonItemOption color="danger" onClick={() => borrarTarea(tarea.id)}>
                    <IonIcon icon={trashOutline} />
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))
          )}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Tab3;