'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { LipSyncTest } from '@/containers/avatar/LipSyncTest';
import { useVTubeStudio } from '@/hooks/useVTubeStudio';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import {
	FiAlertCircle,
	FiCheckCircle,
	FiCpu,
	FiGrid,
	FiRefreshCw,
	FiUser,
	FiWifi,
	FiWifiOff,
} from 'react-icons/fi';

export const AvatarContainer = () => {
	const {
		connecting,
		connected,
		error,
		stats,
		models,
		currentModel,
		connect,
		disconnect,
		loadModel,
		refreshModels,
	} = useVTubeStudio();

	return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2"
      >
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-bold text-3xl [font-family:var(--font-unbounded)] sm:text-4xl">
            <span className="bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent dark:from-[#A78BFA] dark:to-[#22D3EE]">
              Avatar VTuber
            </span>
            <span className="ml-3 inline-block animate-[twinkle_3s_ease-in-out_infinite] text-amber-400 dark:text-[#FDE68A]">
              <Star size={20} className="fill-amber-400 dark:fill-[#FDE68A]" />
            </span>
          </h1>
          <Badge
            variant="secondary"
            className="rounded-full px-3 py-0.5 text-xs"
          >
            VTube Studio
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Conectate a VTube Studio para controlar tu modelo Live2D
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Conexión & Modelos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-6 lg:col-span-2"
        >
          {/* Connection Card */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FiWifi size={18} className="text-primary" />
                Conexión
              </CardTitle>
              <CardDescription>
                Conectate al WebSocket de VTube Studio (puerto por defecto:
                8001)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 space-y-1.5">
                  <label
                    htmlFor="vts-port"
                    className="font-medium text-muted-foreground text-xs"
                  >
                    Puerto
                  </label>
                  <Input
                    id="vts-port"
                    type="number"
                    defaultValue={8001}
                    disabled={connected || connecting}
                    className="max-w-[120px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  {connected ? (
                    <Button onClick={disconnect} variant="outline">
                      Desconectar
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        const portEl = document.getElementById(
                          "vts-port",
                        ) as HTMLInputElement;
                        connect(Number(portEl?.value) || 8001);
                      }}
                      disabled={connecting}
                    >
                      {connecting ? "Conectando..." : "Conectar"}
                    </Button>
                  )}
                  {connected && (
                    <Button
                      onClick={refreshModels}
                      variant="ghost"
                      size="icon"
                      title="Refrescar"
                    >
                      <FiRefreshCw size={16} />
                    </Button>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="mt-4 flex items-center gap-2">
                {connected ? (
                  <span className="flex items-center gap-1.5 text-green-500 text-xs">
                    <FiCheckCircle size={14} />
                    Conectado
                  </span>
                ) : connecting ? (
                  <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <span className="h-3 w-3 animate-pulse rounded-full bg-yellow-500" />
                    Conectando...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <FiWifiOff size={14} />
                    Desconectado
                  </span>
                )}
                {stats && connected && (
                  <span className="text-muted-foreground text-xs">
                    VTS {stats.vTubeStudioVersion} —{" "}
                    {stats.framerate.toFixed(0)} fps
                  </span>
                )}
              </div>

              {error && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <FiAlertCircle
                    size={16}
                    className="mt-0.5 shrink-0 text-destructive"
                  />
                  <p className="text-destructive text-xs">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modelos disponibles */}
          {connected && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FiGrid size={18} className="text-chart-1" />
                  Modelos disponibles
                </CardTitle>
                <CardDescription>
                  {models.length > 0
                    ? `${models.length} modelo${models.length !== 1 ? "s" : ""} encontrado${models.length !== 1 ? "s" : ""} en VTube Studio`
                    : "No se encontraron modelos"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {models.length === 0 ? (
                  <p className="py-4 text-center text-muted-foreground text-xs">
                    No hay modelos disponibles. Cargá uno en VTube Studio
                    primero.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {models.map((model) => {
                      const isLoaded = currentModel?.modelID === model.modelID;
                      return (
                        <button
                          key={model.modelID}
                          type="button"
                          onClick={() => loadModel(model.modelID)}
                          disabled={isLoaded}
                          className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all ${
                            isLoaded
                              ? "border-primary/50 bg-primary/5"
                              : "border-border hover:border-primary/30 hover:bg-muted/50"
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-xs ${
                              isLoaded
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted-foreground/10 text-muted-foreground"
                            }`}
                          >
                            {model.modelName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-xs">
                              {model.modelName}
                            </p>
                            <p className="truncate text-[10px] text-muted-foreground">
                              {model.vtsModelName || model.modelID}
                            </p>
                          </div>
                          {isLoaded && (
                            <Badge
                              variant="outline"
                              className="shrink-0 border-primary/30 px-1.5 py-0 text-[10px]"
                            >
                              Activo
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Info Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          {/* Current model info */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FiUser size={18} className="text-chart-1" />
                Modelo activo
              </CardTitle>
              <CardDescription>
                {currentModel ? currentModel.modelName : "Ninguno"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentModel ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">
                        Nombre
                      </span>
                      <span className="font-medium text-foreground text-xs">
                        {currentModel.modelName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">ID</span>
                      <span className="max-w-[180px] truncate font-medium text-foreground text-xs">
                        {currentModel.modelID}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">
                        Motorphysics
                      </span>
                      <span className="font-medium text-foreground text-xs">
                        {currentModel.hasPhysicsFile ? "Sí" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">
                        Texturas
                      </span>
                      <span className="font-medium text-foreground text-xs">
                        {currentModel.numberOfTextures}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">
                        Parámetros
                      </span>
                      <span className="font-medium text-foreground text-xs">
                        {currentModel.numberOfLive2DParameters}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">
                        ArtMeshes
                      </span>
                      <span className="font-medium text-foreground text-xs">
                        {currentModel.numberOfLive2DArtmeshes}
                      </span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">
                        Posición X
                      </span>
                      <span className="font-medium text-foreground text-xs">
                        {currentModel.modelPosition.positionX.toFixed(3)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">
                        Posición Y
                      </span>
                      <span className="font-medium text-foreground text-xs">
                        {currentModel.modelPosition.positionY.toFixed(3)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">
                        Rotación
                      </span>
                      <span className="font-medium text-foreground text-xs">
                        {currentModel.modelPosition.rotation.toFixed(1)}°
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">
                        Escala
                      </span>
                      <span className="font-medium text-foreground text-xs">
                        {currentModel.modelPosition.size.toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <FiUser size={20} className="text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    No hay ningún modelo activo.
                    <br />
                    Conectate a VTube Studio y seleccioná un modelo.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick stats */}
          {stats && connected && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FiCpu size={18} className="text-primary" />
                  Rendimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">FPS</span>
                    <span className="font-medium text-foreground text-xs">
                      {stats.framerate.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">
                      Uptime
                    </span>
                    <span className="font-medium text-foreground text-xs">
                      {Math.floor(stats.uptime / 60)}m{" "}
                      {Math.floor(stats.uptime % 60)}s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">
                      Ventana
                    </span>
                    <span className="font-medium text-foreground text-xs">
                      {stats.vTubeStudioVersion}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {connected && currentModel && <LipSyncTest connected={connected} />}
        </motion.div>
      </div>
    </div>
  );
};
