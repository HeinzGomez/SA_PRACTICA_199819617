import { useState, useCallback, useEffect } from 'react';
import { recursosApi } from '../../api/res';
import { consultarAccesoPanelAdmin } from '../../services/roles.service';
import type { RepositorioInfo, VersionArchivo } from '../../types/recursos.types';

interface UseRepositorioReturn {
  repositorio: RepositorioInfo | null;
  versiones: Record<number, VersionArchivo[]>;
  selectedVersions: Record<number, number>;
  selectedFileId: number | null;
  isAdmin: boolean;
  loading: boolean;
  isAddingFile: boolean;
  addingVersionFileId: number | null;
  setSelectedFileId: (id: number | null) => void;
  setSelectedVersion: (idArchivo: number, idVersion: number) => void;
  openAddFile: () => void;
  closeAddFile: () => void;
  openAddVersion: (idArchivo: number) => void;
  closeAddVersion: () => void;
  createRepo: (nombre: string) => Promise<void>;
  addFile: (params: { nombre: string; link: string }) => Promise<void>;
  addVersion: (idArchivo: number, params: { link: string; tag: string }) => Promise<void>;
  deleteFile: (idArchivo: number) => Promise<void>;
  tagVersion: (idVersion: number, tag: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useRepositorio(idClase: number, isOpen: boolean): UseRepositorioReturn {
  const [repositorio, setRepositorio] = useState<RepositorioInfo | null>(null);
  const [versiones, setVersiones] = useState<Record<number, VersionArchivo[]>>({});
  const [selectedVersions, setSelectedVersions] = useState<Record<number, number>>({});
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [addingVersionFileId, setAddingVersionFileId] = useState<number | null>(null);

  const fetchVersiones = useCallback(async (idArchivo: number) => {
    try {
      const res = await recursosApi.consultarVersionesArchivo(idArchivo);
      if (res.exito && res.versiones) {
        setVersiones(prev => ({ ...prev, [idArchivo]: res.versiones || [] }));
        if (res.versiones.length > 0) {
          const latest = res.versiones.find(v => v.latest) || res.versiones[0];
          setSelectedVersions(prev => ({ ...prev, [idArchivo]: latest.id_version }));
        }
      }
    } catch (error) {
      console.warn(`Error al cargar versiones para archivo ${idArchivo}:`, error);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!idClase || !isOpen) return;
    setLoading(true);
    try {
      const adminAccess = await consultarAccesoPanelAdmin();
      setIsAdmin(adminAccess);

      const res = await recursosApi.consultarRepositorio(idClase);
      if (res.exito && res.repositorio) {
        setRepositorio(res.repositorio);
        for (const archivo of res.repositorio.archivos) {
          await fetchVersiones(archivo.id_archivo);
        }
      } else {
        setRepositorio(null);
      }
    } catch (error) {
      console.warn('Error al cargar repositorio:', error);
      setRepositorio(null);
    } finally {
      setLoading(false);
    }
  }, [idClase, isOpen, fetchVersiones]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setIsAddingFile(false);
      setAddingVersionFileId(null);
    }
  }, [isOpen, loadData]);

  const createRepo = useCallback(async (nombre: string) => {
    await recursosApi.crearRepositorio({ id_clase: idClase, nombre });
    await loadData();
  }, [idClase, loadData]);

  const addFile = useCallback(async (params: { nombre: string; link: string }) => {
    if (!repositorio) return;
    await recursosApi.agregarArchivo({
      id_repositorio: repositorio.id_repositorio,
      nombre: params.nombre,
      link: params.link,
      tag: '',
      hash: '',
    });
    setIsAddingFile(false);
    await loadData();
  }, [repositorio, loadData]);

  const addVersion = useCallback(async (idArchivo: number, params: { link: string; tag: string }) => {
    await recursosApi.actualizarVersionArchivo(idArchivo, {
      link: params.link,
      tag: params.tag,
      hash: '',
    });
    setAddingVersionFileId(null);
    await fetchVersiones(idArchivo);
  }, [fetchVersiones]);

  const deleteFile = useCallback(async (idArchivo: number) => {
    await recursosApi.eliminarArchivo(idArchivo);
    await loadData();
  }, [loadData]);

  const tagVersion = useCallback(async (idVersion: number, tag: string) => {
    await recursosApi.actualizarTag(idVersion, tag);
    for (const archivo of repositorio?.archivos || []) {
      await fetchVersiones(archivo.id_archivo);
    }
  }, [repositorio, fetchVersiones]);

  return {
    repositorio,
    versiones,
    selectedVersions,
    selectedFileId,
    isAdmin,
    loading,
    isAddingFile,
    addingVersionFileId,
    setSelectedFileId,
    setSelectedVersion: (idArchivo, idVersion) =>
      setSelectedVersions(prev => ({ ...prev, [idArchivo]: idVersion })),
    openAddFile: () => setIsAddingFile(true),
    closeAddFile: () => setIsAddingFile(false),
    openAddVersion: (idArchivo) => setAddingVersionFileId(idArchivo),
    closeAddVersion: () => setAddingVersionFileId(null),
    createRepo,
    addFile,
    addVersion,
    deleteFile,
    tagVersion,
    reload: loadData,
  };
}
