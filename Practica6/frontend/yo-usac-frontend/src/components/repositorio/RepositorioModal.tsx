import React, { useState } from 'react';
import { useRepositorio } from './useRepositorio';

interface RepositorioModalProps {
  isOpen: boolean;
  onClose: () => void;
  idClase: number;
}

export const RepositorioModal: React.FC<RepositorioModalProps> = ({ isOpen, onClose, idClase }) => {
  const {
    repositorio, versiones, selectedVersions, selectedFileId, isAdmin, loading,
    isAddingFile, addingVersionFileId,
    setSelectedFileId, setSelectedVersion,
    openAddFile, closeAddFile, openAddVersion, closeAddVersion,
    createRepo, addFile, addVersion, deleteFile, tagVersion,
  } = useRepositorio(idClase, isOpen);

  const [fileForm, setFileForm] = useState({ nombre: '', link: '' });
  const [versionForm, setVersionForm] = useState({ link: '', tag: '' });
  const [taggingVersionId, setTaggingVersionId] = useState<number | null>(null);
  const [tagInput, setTagInput] = useState('');

  if (!isOpen) return null;

  const handleCreateRepo = async () => {
    try {
      await createRepo('Repositorio de Clase');
    } catch {
      alert('Error al crear repositorio');
    }
  };

  const handleSubmitFile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addFile(fileForm);
      setFileForm({ nombre: '', link: '' });
    } catch {
      alert('Error al agregar archivo');
    }
  };

  const handleSubmitVersion = async (e: React.FormEvent, idArchivo: number) => {
    e.preventDefault();
    try {
      await addVersion(idArchivo, versionForm);
      setVersionForm({ link: '', tag: '' });
    } catch {
      alert('Error al agregar versión');
    }
  };

  const handleDelete = async (idArchivo: number) => {
    if (!confirm('¿Estás seguro de eliminar este archivo y todas sus versiones?')) return;
    try {
      await deleteFile(idArchivo);
    } catch {
      alert('Error al eliminar archivo');
    }
  };

  const handleTagVersion = async (idVersion: number) => {
    try {
      await tagVersion(idVersion, tagInput);
      setTaggingVersionId(null);
      setTagInput('');
    } catch {
      alert('Error al actualizar tag');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9E1FFF]/10 text-[#9E1FFF]">
              <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">
                {repositorio?.nombre || 'Repositorio de Clase'}
              </h2>
              <p className="text-sm text-neutral-500">Gestor de archivos y versiones</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-neutral-400 transition hover:bg-neutral-200 hover:text-neutral-700">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#9E1FFF] border-t-transparent" />
            </div>
          ) : !repositorio ? (
            <div className="flex flex-col items-center justify-center py-10 text-neutral-500">
              <p className="mb-4">Este curso aún no tiene un repositorio.</p>
              {isAdmin && (
                <button
                  onClick={handleCreateRepo}
                  className="rounded-lg bg-[#9E1FFF] px-4 py-2 font-medium text-white transition hover:bg-[#7a00c9]"
                >
                  Crear Repositorio
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {isAdmin && !isAddingFile && (
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => { openAddFile(); setFileForm({ nombre: '', link: '' }) }}
                    className="flex items-center gap-2 rounded-lg bg-[#9E1FFF] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#7a00c9]"
                  >
                    + Nuevo Archivo
                  </button>
                </div>
              )}

              {isAddingFile && (
                <form onSubmit={handleSubmitFile} className="mb-4 flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <h4 className="font-semibold text-neutral-800">Agregar Nuevo Archivo</h4>
                  <input required placeholder="Nombre del archivo" value={fileForm.nombre} onChange={e => setFileForm({...fileForm, nombre: e.target.value})} className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#9E1FFF]" />
                  <input required placeholder="Enlace de Drive" value={fileForm.link} onChange={e => setFileForm({...fileForm, link: e.target.value})} className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#9E1FFF]" />
                  <div className="flex justify-end gap-2 mt-2">
                    <button type="button" onClick={closeAddFile} className="px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-lg">Cancelar</button>
                    <button type="submit" className="rounded-lg bg-[#9E1FFF] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#7a00c9]">Guardar</button>
                  </div>
                </form>
              )}

              {repositorio.archivos.length === 0 ? (
                <p className="text-center text-neutral-400 py-6">No hay archivos en este repositorio.</p>
              ) : (
                repositorio.archivos.map(archivo => (
                  <div key={archivo.id_archivo} className={`flex flex-col gap-3 rounded-xl border p-4 transition-colors ${selectedFileId === archivo.id_archivo ? 'border-[#9E1FFF] bg-[#9E1FFF]/5' : 'border-neutral-200'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer" onClick={() => setSelectedFileId(archivo.id_archivo)}>
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selectedFileId === archivo.id_archivo ? 'bg-[#9E1FFF] text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>
                        </div>
                        <span className={`font-medium ${selectedFileId === archivo.id_archivo ? 'text-[#9E1FFF]' : 'text-neutral-800'}`}>
                          {archivo.nombre}
                        </span>
                      </div>

                      <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                        {versiones[archivo.id_archivo]?.length > 0 ? (
                          <>
                            <select
                              value={selectedVersions[archivo.id_archivo] || ''}
                              onChange={(e) => setSelectedVersion(archivo.id_archivo, Number(e.target.value))}
                              className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 outline-none focus:border-[#9E1FFF]"
                            >
                              {versiones[archivo.id_archivo].map(ver => (
                                <option key={ver.id_version} value={ver.id_version}>
                                  {ver.tag || ver.hash || `v${ver.id_version}`} {ver.latest ? '(Latest)' : ''}
                                </option>
                              ))}
                            </select>

                            {selectedVersions[archivo.id_archivo] && (
                              <a
                                href={versiones[archivo.id_archivo].find(v => v.id_version === selectedVersions[archivo.id_archivo])?.link || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-lg bg-[#9E1FFF] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#7a00c9]"
                              >
                                Abrir
                              </a>
                            )}

                            {isAdmin && selectedVersions[archivo.id_archivo] && (
                              taggingVersionId === selectedVersions[archivo.id_archivo] ? (
                                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                  <input
                                    autoFocus
                                    placeholder="Tag"
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleTagVersion(selectedVersions[archivo.id_archivo]); if (e.key === 'Escape') { setTaggingVersionId(null); setTagInput(''); } }}
                                    className="w-24 rounded-lg border px-2 py-1 text-xs outline-none focus:border-[#9E1FFF]"
                                  />
                                  <button onClick={() => handleTagVersion(selectedVersions[archivo.id_archivo])} className="p-1 text-[#9E1FFF] hover:bg-neutral-100 rounded" title="Guardar tag">
                                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="20 6 9 17 4 12"/></svg>
                                  </button>
                                  <button onClick={() => { setTaggingVersionId(null); setTagInput(''); }} className="p-1 text-neutral-400 hover:bg-neutral-100 rounded" title="Cancelar">
                                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    const ver = versiones[archivo.id_archivo]?.find(v => v.id_version === selectedVersions[archivo.id_archivo]);
                                    setTaggingVersionId(selectedVersions[archivo.id_archivo]);
                                    setTagInput(ver?.tag || '');
                                  }}
                                  className="p-1.5 text-neutral-400 hover:text-[#9E1FFF] hover:bg-neutral-100 rounded-lg"
                                  title="Etiquetar versión"
                                >
                                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                                  </svg>
                                </button>
                              )
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-neutral-400">Sin versiones</span>
                        )}

                        {isAdmin && (
                          <div className="flex items-center gap-1 ml-2">
                            <button onClick={() => { openAddVersion(archivo.id_archivo); setVersionForm({ link: '', tag: '' }) }} className="p-1.5 text-neutral-400 hover:text-[#9E1FFF] hover:bg-neutral-100 rounded-lg" title="Agregar versión">
                              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M12 5v14M5 12h14"/></svg>
                            </button>
                            <button onClick={() => handleDelete(archivo.id_archivo)} className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Eliminar archivo">
                              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {isAdmin && addingVersionFileId === archivo.id_archivo && (
                      <form onSubmit={(e) => handleSubmitVersion(e, archivo.id_archivo)} className="mt-3 flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4">
                        <h5 className="text-sm font-semibold text-neutral-800">Nueva Versión</h5>
                        <input required placeholder="Enlace de Drive" value={versionForm.link} onChange={e => setVersionForm({...versionForm, link: e.target.value})} className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#9E1FFF]" />
                        <input placeholder="Tag (opcional)" value={versionForm.tag} onChange={e => setVersionForm({...versionForm, tag: e.target.value})} className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#9E1FFF]" />
                        <div className="flex justify-end gap-2 mt-1">
                          <button type="button" onClick={closeAddVersion} className="px-3 py-1 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancelar</button>
                          <button type="submit" className="rounded-lg bg-[#9E1FFF] px-3 py-1 text-sm font-medium text-white hover:bg-[#7a00c9]">Guardar Versión</button>
                        </div>
                      </form>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
