import { useState, useEffect } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonList, IonItem, IonLabel, IonIcon, IonText, IonBadge,
  IonItemSliding, IonItemOptions, IonItemOption, useIonViewWillEnter
} from '@ionic/react';
import { alarmOutline, timerOutline, trashOutline, alertCircleOutline } from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';

interface Tarea {
  id: number;
  titulo: string;
  tipo: 'recordatorio' | 'temporizador';
  fechaHora?: string;
  minutos?: number;
  completada: boolean;
  tiempoInicio?: number; // Nuevo: para calcular countdown
}

const Tab3: React.FC = () => {
  const [tareas, setTareas] = useState<Tarea[]>([]);

  const cargarTareas = async () => {
    const { value } = await Preferences.get({ key: 'tareas' });
    const tareasGuardadas: Tarea[] = value ? JSON.parse(value) : [];

    // Si es temporizador y no tiene tiempoInicio, lo ponemos ahora
    const tareasActualizadas = tareasGuardadas.map(t => {
      if (t.tipo === 'temporizador' && !t.tiempoInicio && !t.completada) {
        return { ...t, tiempoInicio: Date.now() };
      }
      return t;
    });

    setTareas(tareasActualizadas);
    await Preferences.set({ key: 'tareas', value: JSON.stringify(tareasActualizadas) });
  };

  // Carga inicial y cuando entras a la tab
  useEffect(() => {
    cargarTareas();
  }, []);

  useIonViewWillEnter(() => {
    cargarTareas();
  });

  // Actualiza countdown cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setTareas(prev => {
        const actualizadas = prev.map(t => {
          if (t.tipo === 'temporizador' && t.minutos && t.tiempoInicio && !t.completada) {
            const transcurridoSegundos = Math.floor((Date.now() - t.tiempoInicio) / 1000);
            const totalSegundos = t.minutos * 60;
            const restantes = totalSegundos - transcurridoSegundos;

            if (restantes <= 0) {
              return { ...t, completada: true }; // Marca como completada automáticamente
            }
            return t;
          }
          return t;
        });

        // Guardamos solo si cambió algo
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

  const formatoTiempoRestante = (tarea: Tarea) => {
    if (tarea.tipo === 'recordatorio' && tarea.fechaHora) {
      const fecha = new Date(tarea.fechaHora);
      return fecha.toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }

    if (tarea.tipo === 'temporizador' && tarea.minutos && tarea.tiempoInicio && !tarea.completada) {
      const transcurridoSegundos = Math.floor((Date.now() - tarea.tiempoInicio) / 1000);
      const totalSegundos = tarea.minutos * 60;
      let restantes = totalSegundos - transcurridoSegundos;

      if (restantes < 0) restantes = 0;

      const min = Math.floor(restantes / 60);
      const seg = restantes % 60;
      return `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
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
            <IonText>
              <p style={{ textAlign: 'center', marginTop: '80px', fontSize: '1.1rem', color: '#90e0ef' }}>
                Sin tareas aún<br />¡Crea una en Recordatorios!
              </p>
            </IonText>
          ) : (
            tareas.map((tarea) => (
              <IonItemSliding key={tarea.id}>
                <IonItem
                  className="neon-item"
                  button
                  onClick={() => toggleCompletada(tarea.id)}
                  style={{
                    opacity: tarea.completada ? 0.6 : 1,
                    textDecoration: tarea.completada ? 'line-through' : 'none'
                  }}
                >
                  <IonIcon
                    icon={
                      tarea.tipo === 'recordatorio' ? alarmOutline :
                      tarea.completada ? timerOutline :
                      alertCircleOutline // Icono diferente si está corriendo
                    }
                    slot="start"
                    color={tarea.completada ? 'medium' : 'primary'}
                  />
                  <IonLabel>
                    <h2 style={{ fontWeight: tarea.completada ? 'normal' : '500' }}>
                      {tarea.titulo}
                    </h2>
                    <p style={{ fontSize: '1.1rem', color: tarea.completada ? '#666' : '#90e0ef' }}>
                      {formatoTiempoRestante(tarea)}
                      {tarea.completada && tarea.tipo === 'temporizador' && ' - ¡Terminado!'}
                    </p>
                  </IonLabel>
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