import React, { useState, useMemo } from 'react';
import { 
  Music, 
  CheckSquare, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Printer, 
  AlertCircle,
  X,
  FileText,
  Calendar,
  Sparkles,
  CalendarPlus,
  BookOpen,
  Copy,
  Check
} from 'lucide-react';
import { 
  Chorister, 
  CommitteeMember, 
  Hymn, 
  HymnCategory, 
  TaskAssignment, 
  TaskDuty, 
  TaskPriority, 
  TaskStatus, 
  WorkAndBudget,
  PracticeSession,
  HymnalSong
} from '../types';
import { PracticeScheduler } from './PracticeScheduler';
import { isPracticeForEvent } from '../utils/practiceSync';
import { HymnAutocompleteInput } from './HymnAutocompleteInput';
import { ALL_HYMNS, getHymnByNumber } from '../data/hymnsDatabase';
import { CHOIR_LOGO_URL } from '../utils/driveImage';

interface WorkSubTabProps {
  workAndBudget: WorkAndBudget;
  eventTitle: string;
  choristers: Chorister[];
  activeMember: CommitteeMember;
  showHymnSheet?: boolean; // Hymn sheet is only for Christmas & New Year, Carols, Feast, and Easter
  committeeMembers?: CommitteeMember[];
  hideApproval?: boolean; // When true, no hymn approving elements
  allPractices?: PracticeSession[];
  onSavePractices?: (updatedPractices: PracticeSession[], description?: string) => Promise<void>;
  onDeletePractice?: (practiceId: string) => Promise<void> | void;
  onSaveWork: (updatedWork: WorkAndBudget) => Promise<void>;
}

export const WorkSubTab: React.FC<WorkSubTabProps> = ({
  workAndBudget,
  eventTitle,
  choristers,
  activeMember,
  showHymnSheet = false,
  committeeMembers = [],
  hideApproval = false,
  allPractices = [],
  onSavePractices,
  onDeletePractice,
  onSaveWork,
}) => {
  const [activeSection, setActiveSection] = useState<'hymns' | 'tasks' | 'practices'>('hymns');
  const [isHymnModalOpen, setIsHymnModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isHymnSheetModalOpen, setIsHymnSheetModalOpen] = useState(false);
  const [editingHymn, setEditingHymn] = useState<Hymn | null>(null);
  const [editingTask, setEditingTask] = useState<TaskAssignment | null>(null);
  const [viewingHymnLyrics, setViewingHymnLyrics] = useState<HymnalSong | null>(null);
  const [copiedModalLyrics, setCopiedModalLyrics] = useState(false);

  const handleViewLyrics = (hymn: Hymn) => {
    let found: HymnalSong | undefined;
    if (hymn.hymnNumber) {
      found = getHymnByNumber(hymn.hymnNumber);
    }
    if (!found && hymn.title) {
      const clean = hymn.title.trim().toLowerCase();
      found = ALL_HYMNS.find(
        (h) =>
          h.title.toLowerCase().includes(clean) ||
          clean.includes(h.title.toLowerCase())
      );
    }
    if (found) {
      setViewingHymnLyrics(found);
    } else {
      setViewingHymnLyrics({
        number: parseInt(hymn.hymnNumber || '0', 10) || 0,
        title: hymn.title,
        category: hymn.category,
        book: 'කිතුනු ගීතිකා 1',
        liturgicalPart: hymn.category,
        verses: [],
      });
    }
  };

  // Sync practices for this event across the Main Practice Tab and this event tab
  const displayedPractices = useMemo(() => {
    const map = new Map<string, PracticeSession>();

    // 1. Practices from this event's own workAndBudget - strictly validate against current event
    (workAndBudget.practices || []).forEach((p) => {
      if (isPracticeForEvent(p, eventTitle)) {
        map.set(p.id, { ...p, eventTitle: p.eventTitle || eventTitle });
      }
    });

    // 2. Practices from the central synced practices registry matching this event
    if (allPractices && allPractices.length > 0) {
      allPractices.forEach((p) => {
        if (isPracticeForEvent(p, eventTitle)) {
          map.set(p.id, { ...p, eventTitle: p.eventTitle || eventTitle });
        }
      });
    }

    return Array.from(map.values()).sort((a, b) => (a.date > b.date ? -1 : 1));
  }, [allPractices, eventTitle, workAndBudget.practices]);

  const handleSavePractices = async (updatedEventPractices: PracticeSession[]) => {
    // Ensure every practice session is properly tagged with this event's title
    const taggedPractices = updatedEventPractices.map((p) => ({
      ...p,
      eventTitle: p.eventTitle || eventTitle,
    }));

    // Update local workAndBudget
    await onSaveWork({
      ...workAndBudget,
      practices: taggedPractices,
    });

    // Sync seamlessly into the central practices database and the Main Practice Tab
    if (onSavePractices) {
      const currentEventIds = new Set(displayedPractices.map((p) => p.id));
      const otherPractices = (allPractices || []).filter(
        (p) => !currentEventIds.has(p.id) && !isPracticeForEvent(p, eventTitle)
      );
      const unifiedPractices = [...taggedPractices, ...otherPractices];
      await onSavePractices(unifiedPractices, `Updated practices for ${eventTitle}`);
    }
  };

  const handleDeletePractice = async (practiceId: string) => {
    // 1. Update local event workAndBudget
    const remainingForEvent = (workAndBudget.practices || []).filter((p) => p.id !== practiceId);
    await onSaveWork({
      ...workAndBudget,
      practices: remainingForEvent,
    });

    // 2. Delegate to global delete or save
    if (onDeletePractice) {
      await onDeletePractice(practiceId);
    } else if (onSavePractices) {
      const remainingGlobal = (allPractices || []).filter((p) => p.id !== practiceId);
      await onSavePractices(remainingGlobal, `Removed practice from ${eventTitle}`);
    }
  };

  // Hymn form state: NO composer field as per explicit request
  const [hymnForm, setHymnForm] = useState({
    title: '',
    category: 'Entrance' as HymnCategory,
    hymnNumber: '',
    keySignature: 'C Major',
    notes: '',
  });

  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    duty: 'Cantor' as TaskDuty,
    assignedTo: choristers[0]?.name || activeMember.name,
    deadline: 'Before Mass Rehearsal',
    priority: 'High' as TaskPriority,
    status: 'In Progress' as TaskStatus,
    notes: '',
  });

  const categories: HymnCategory[] = [
    'Entrance',
    'Kyrie',
    'Gloria',
    'Responsorial Psalm',
    'Gospel Acclamation',
    'Offertory',
    'Sanctus',
    'Memorial Acclamation',
    'Agnus Dei',
    'Communion',
    'Recessional',
    'Post-Communion',
  ];

  const duties: TaskDuty[] = [
    'Organist',
    'Cantor',
    'Choir Director',
    'Sound & Mic Setup',
    'Robes & Folders',
    'Altar & Sanctuary',
    'Soloist',
    'Printing & Booklets',
    'Hospitality & Logistics',
    'General',
  ];

  // Default fallback committee members
  const defaultCommittee = [
    { name: 'Joshua Peiris', role: 'President' },
    { name: 'Shannon Peiris', role: 'Secretary' },
    { name: 'Dinoli Fernando', role: 'Assistant Secretary' },
    { name: 'Dahami Lochana', role: 'Assistant Secretary' },
    { name: 'Dion Fernando', role: 'Treasurer' },
    { name: 'Devsith Mortier', role: 'Assistant Treasurer' },
  ];

  const committeeList = committeeMembers.length > 0 
    ? committeeMembers.map((m) => ({ name: m.name, role: m.role }))
    : defaultCommittee;

  // Open hymn modal
  const handleOpenHymnModal = (hymn?: Hymn) => {
    if (hymn) {
      setEditingHymn(hymn);
      setHymnForm({
        title: hymn.title,
        category: hymn.category,
        hymnNumber: hymn.hymnNumber || '',
        keySignature: hymn.keySignature || 'C Major',
        notes: hymn.notes || '',
      });
    } else {
      setEditingHymn(null);
      setHymnForm({
        title: '',
        category: 'Entrance',
        hymnNumber: '',
        keySignature: 'C Major',
        notes: '',
      });
    }
    setIsHymnModalOpen(true);
  };

  const handleSaveHymn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hymnForm.title.trim()) return;

    let updatedHymns = [...workAndBudget.hymns];
    if (editingHymn) {
      updatedHymns = updatedHymns.map((h) => 
        h.id === editingHymn.id ? { ...h, ...hymnForm } : h
      );
    } else {
      const newHymn: Hymn = {
        id: `hymn-${Date.now()}`,
        ...hymnForm,
      };
      updatedHymns.push(newHymn);
    }

    await onSaveWork({
      ...workAndBudget,
      hymns: updatedHymns,
    });

    setIsHymnModalOpen(false);
  };

  const handleDeleteHymn = async (id: string) => {
    const updatedHymns = workAndBudget.hymns.filter((h) => h.id !== id);
    await onSaveWork({
      ...workAndBudget,
      hymns: updatedHymns,
    });
  };

  // Task Handlers
  const handleOpenTaskModal = (task?: TaskAssignment) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title,
        duty: task.duty,
        assignedTo: task.assignedTo,
        deadline: task.deadline,
        priority: task.priority,
        status: task.status,
        notes: task.notes || '',
      });
    } else {
      setEditingTask(null);
      setTaskForm({
        title: '',
        duty: 'Cantor',
        assignedTo: choristers[0]?.name || activeMember.name,
        deadline: 'Service Schedule',
        priority: 'High',
        status: 'Pending',
        notes: '',
      });
    }
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    let updatedTasks = [...workAndBudget.tasks];
    if (editingTask) {
      updatedTasks = updatedTasks.map((t) =>
        t.id === editingTask.id ? { ...t, ...taskForm } : t
      );
    } else {
      const newTask: TaskAssignment = {
        id: `task-${Date.now()}`,
        ...taskForm,
        approvedByPresident: hideApproval ? true : activeMember.role === 'President',
      };
      updatedTasks.push(newTask);
    }

    await onSaveWork({
      ...workAndBudget,
      tasks: updatedTasks,
    });

    setIsTaskModalOpen(false);
  };

  const handleDeleteTask = async (id: string) => {
    const updatedTasks = workAndBudget.tasks.filter((t) => t.id !== id);
    await onSaveWork({
      ...workAndBudget,
      tasks: updatedTasks,
    });
  };

  const handleToggleTaskStatus = async (task: TaskAssignment) => {
    const nextStatus: Record<TaskStatus, TaskStatus> = {
      'Pending': 'In Progress',
      'In Progress': 'Completed',
      'Completed': 'Pending',
    };
    const updatedTasks = workAndBudget.tasks.map((t) =>
      t.id === task.id ? { ...t, status: nextStatus[t.status] } : t
    );
    await onSaveWork({
      ...workAndBudget,
      tasks: updatedTasks,
    });
  };

  // President sign-off action
  const handlePresidentApprove = async () => {
    await onSaveWork({
      ...workAndBudget,
      workflowStatus: 'President Approved',
      lastUpdatedBy: `${activeMember.name} (${activeMember.role})`,
      lastUpdatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    });
  };

  return (
    <div className="space-y-6">
      {showHymnSheet && (
        <div className="flex justify-end">
          <button
            id="open-hymn-sheet-modal-btn"
            onClick={() => setIsHymnSheetModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 transition-colors border border-amber-500/30"
            title="View & Print Official Choral Hymn Sheet"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Hymn Sheet</span>
          </button>
        </div>
      )}

      {/* Sub-selector pills: Hymn Selection vs Task Assignment vs Scheduling Practices */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#222222] pb-3 gap-3">
        <div className="flex items-center gap-1.5 bg-[#141414] p-1 rounded-xl border border-[#262626] overflow-x-auto">
          <button
            id="work-hymn-selection-tab"
            onClick={() => setActiveSection('hymns')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'hymns'
                ? 'bg-[#222222] text-white shadow-sm border border-[#3A3A3A]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-amber-400" />
            <span>Hymn Selection ({workAndBudget.hymns.length})</span>
          </button>

          <button
            id="work-task-assignment-tab"
            onClick={() => setActiveSection('tasks')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'tasks'
                ? 'bg-[#222222] text-white shadow-sm border border-[#3A3A3A]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
            <span>Task Assignments ({workAndBudget.tasks.length})</span>
          </button>

          <button
            id="work-scheduling-practices-tab"
            onClick={() => setActiveSection('practices')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeSection === 'practices'
                ? 'bg-[#222222] text-white shadow-sm border border-[#3A3A3A]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <CalendarPlus className="w-3.5 h-3.5 text-purple-400" />
            <span>Scheduling Practices ({displayedPractices.length})</span>
          </button>
        </div>

        {activeSection === 'hymns' ? (
          <button
            id="add-hymn-btn"
            onClick={() => handleOpenHymnModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-all shadow-md shadow-amber-500/20 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Hymn</span>
          </button>
        ) : activeSection === 'tasks' ? (
          <button
            id="add-task-btn"
            onClick={() => handleOpenTaskModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign Task</span>
          </button>
        ) : null}
      </div>

      {/* SECTION 1: HYMN SELECTION */}
      {activeSection === 'hymns' && (
        <div className="space-y-4">
          {workAndBudget.hymns.length === 0 ? (
            <div className="bg-[#121212] rounded-2xl border border-dashed border-[#2C2C2C] p-12 text-center text-neutral-400">
              <Music className="w-8 h-8 mx-auto mb-2 text-neutral-500" />
              <p className="font-semibold text-sm text-white">No hymns selected yet</p>
              <p className="text-xs text-neutral-500 mt-1">
                Select entrance, offertory, communion, and recessional hymns for {eventTitle}.
              </p>
              <button
                onClick={() => handleOpenHymnModal()}
                className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400"
              >
                Add First Hymn
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {workAndBudget.hymns.map((hymn) => (
                <div
                  key={hymn.id}
                  id={`hymn-card-${hymn.id}`}
                  className="bg-[#141414] rounded-xl p-4 border border-[#242424] hover:border-[#333333] transition-all shadow-md flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {hymn.category}
                      </span>
                      {hymn.keySignature && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1C1C1C] text-neutral-300 border border-[#2E2E2E]">
                          Key: {hymn.keySignature}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-white text-sm leading-snug">
                      {hymn.title}
                    </h4>

                    {hymn.hymnNumber && (
                      <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
                        <span>Hymnal No:</span>
                        <b className="text-neutral-200">{hymn.hymnNumber}</b>
                      </div>
                    )}

                    {hymn.notes && (
                      <p className="text-xs text-neutral-300 italic mt-2 bg-[#1A1A1A] p-2.5 rounded-lg border border-[#2A2A2A]">
                        "{hymn.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#222222]">
                    <button
                      type="button"
                      onClick={() => handleViewLyrics(hymn)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors"
                      title="View Hymn Lyrics & Verses"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>පදමාලාව</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenHymnModal(hymn)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#202020] transition-colors"
                        title="Edit Hymn"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteHymn(hymn.id)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove Hymn"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: TASK ASSIGNMENT */}
      {activeSection === 'tasks' && (
        <div className="space-y-4">
          {workAndBudget.tasks.length === 0 ? (
            <div className="bg-[#121212] rounded-2xl border border-dashed border-[#2C2C2C] p-12 text-center text-neutral-400">
              <CheckSquare className="w-8 h-8 mx-auto mb-2 text-neutral-500" />
              <p className="font-semibold text-sm text-white">No duties or tasks assigned</p>
              <p className="text-xs text-neutral-500 mt-1">
                Assign organists, cantors, choir director, sound technicians, and folder coordinators.
              </p>
              <button
                onClick={() => handleOpenTaskModal()}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500"
              >
                Assign First Duty
              </button>
            </div>
          ) : (
            <div className="bg-[#121212] rounded-2xl border border-[#222222] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-300">
                  <thead className="bg-[#171717] border-b border-[#242424] text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Duty / Assignment</th>
                      <th className="py-3 px-4">Role Category</th>
                      <th className="py-3 px-4">Assignee</th>
                      <th className="py-3 px-4">Deadline</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F1F]">
                    {workAndBudget.tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-[#161616] transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">
                          <div>{task.title}</div>
                          {task.notes && (
                            <div className="text-[10px] text-neutral-400 font-normal italic">
                              {task.notes}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1C1C1C] text-neutral-300 border border-[#2E2E2E]">
                            {task.duty}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-medium text-white">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px]">
                              {task.assignedTo.charAt(0)}
                            </span>
                            <span>{task.assignedTo}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-neutral-400 font-mono text-[11px]">
                          {task.deadline}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            task.priority === 'Urgent'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : task.priority === 'High'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {task.priority}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleTaskStatus(task)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                              task.status === 'Completed'
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : task.status === 'In Progress'
                                ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                                : 'bg-[#1C1C1C] text-neutral-400 border border-[#2C2C2C]'
                            }`}
                            title="Click to cycle status"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              task.status === 'Completed' ? 'bg-emerald-400' : task.status === 'In Progress' ? 'bg-blue-400' : 'bg-neutral-500'
                            }`} />
                            <span>{task.status}</span>
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenTaskModal(task)}
                              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-[#202020] transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1 rounded text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: SCHEDULING PRACTICES & CALCULATING ATTENDANCE */}
      {activeSection === 'practices' && (
        <PracticeScheduler
          practices={displayedPractices}
          eventTitle={eventTitle}
          choristers={choristers}
          activeMember={activeMember}
          onSavePractices={handleSavePractices}
          onDeletePractice={handleDeletePractice}
        />
      )}

      {/* Hymn Modal: NO COMPOSER FIELD */}
      {isHymnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] w-full max-w-md rounded-2xl border border-[#2A2A2A] shadow-2xl overflow-hidden animate-in fade-in">
            <div className="bg-[#0D0D0D] text-white px-5 py-4 flex items-center justify-between border-b border-[#222222]">
              <h3 className="font-bold text-sm">
                {editingHymn ? 'Edit Hymn Selection' : 'Add Hymn to Music Program'}
              </h3>
              <button onClick={() => setIsHymnModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveHymn} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                  Hymn Title / Search Hymnal *
                </label>
                <HymnAutocompleteInput
                  value={hymnForm.title}
                  onChange={(val) => setHymnForm({ ...hymnForm, title: val })}
                  onSelectHymn={(hymn) => {
                    const padded = hymn.number < 10 ? `0${hymn.number}` : `${hymn.number}`;
                    setHymnForm((prev) => ({
                      ...prev,
                      title: hymn.title,
                      hymnNumber: padded,
                      category: hymn.liturgicalPart || prev.category,
                    }));
                  }}
                  liturgicalPart={hymnForm.category}
                  placeholder="ගීතිකාවේ නම හෝ අංකය ටයිප් කරන්න..."
                  className="bg-[#181818] border-[#2E2E2E] text-white placeholder:text-neutral-500"
                  theme="dark"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  💡 Type Sinhala title or Hymnal number (1-755) for instant prompts
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Liturgical Part *
                  </label>
                  <select
                    value={hymnForm.category}
                    onChange={(e) => setHymnForm({ ...hymnForm, category: e.target.value as HymnCategory })}
                    className="w-full px-2.5 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-amber-500 text-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className="bg-[#181818] text-white">{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Key Signature
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Eb Major"
                    value={hymnForm.keySignature}
                    onChange={(e) => setHymnForm({ ...hymnForm, keySignature: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-amber-500 text-white placeholder:text-neutral-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                  Hymn Book No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. 06 / 146 / 357"
                  value={hymnForm.hymnNumber}
                  onChange={(e) => setHymnForm({ ...hymnForm, hymnNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-amber-500 text-white placeholder:text-neutral-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                  Rehearsal & Choral Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Choir sings verse 2 in 4-part SATB harmony; pipe organ accompaniment"
                  value={hymnForm.notes}
                  onChange={(e) => setHymnForm({ ...hymnForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-amber-500 text-white placeholder:text-neutral-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setIsHymnModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white hover:bg-[#202020] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl shadow-sm"
                >
                  Save Hymn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] w-full max-w-md rounded-2xl border border-[#2A2A2A] shadow-2xl overflow-hidden animate-in fade-in">
            <div className="bg-[#0D0D0D] text-white px-5 py-4 flex items-center justify-between border-b border-[#222222]">
              <h3 className="font-bold text-sm">
                {editingTask ? 'Edit Task Assignment' : 'Assign Liturgical / Choral Task'}
              </h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Responsorial Psalm tone & Alleluia"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-blue-500 text-white placeholder:text-neutral-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Duty Category *
                  </label>
                  <select
                    value={taskForm.duty}
                    onChange={(e) => setTaskForm({ ...taskForm, duty: e.target.value as TaskDuty })}
                    className="w-full px-2.5 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-blue-500 text-white focus:outline-none"
                  >
                    {duties.map((d) => (
                      <option key={d} value={d} className="bg-[#181818] text-white">{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Assignee *
                  </label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-blue-500 text-white focus:outline-none"
                  >
                    <optgroup label="Committee Members" className="bg-[#181818] text-neutral-400">
                      {committeeList.map((m) => (
                        <option key={m.name} value={m.name} className="bg-[#181818] text-white">
                          {m.name} ({m.role})
                        </option>
                      ))}
                    </optgroup>
                    {choristers.length > 0 && (
                      <optgroup label="Choir Registry" className="bg-[#181818] text-neutral-400">
                        {choristers.map((c) => (
                          <option key={c.id} value={c.name} className="bg-[#181818] text-white">
                            {c.name} ({c.role})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Deadline / Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rehearsal 6:00 PM"
                    value={taskForm.deadline}
                    onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-blue-500 text-white placeholder:text-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as TaskPriority })}
                    className="w-full px-2.5 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-blue-500 text-white focus:outline-none"
                  >
                    <option value="Low" className="bg-[#181818] text-white">Low</option>
                    <option value="Medium" className="bg-[#181818] text-white">Medium</option>
                    <option value="High" className="bg-[#181818] text-white">High</option>
                    <option value="Urgent" className="bg-[#181818] text-white">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                  Execution Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Ensure sheet music folders are placed on choir stalls prior to procession"
                  value={taskForm.notes}
                  onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-blue-500 text-white placeholder:text-neutral-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white hover:bg-[#202020] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-sm"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Hymn Sheet Modal (Only active for Christmas & New Year, Carols, Feast, and Easter) */}
      {showHymnSheet && isHymnSheetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141414] w-full max-w-2xl rounded-2xl border border-[#2A2A2A] shadow-2xl overflow-hidden animate-in fade-in max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#0D0D0D] px-6 py-4 flex items-center justify-between border-b border-[#222222]">
              <div className="flex items-center gap-3">
                <img 
                  src={CHOIR_LOGO_URL} 
                  alt="St. Cecilia's Choir Crest" 
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-500/50 shadow-md bg-black"
                />
                <div>
                  <h3 className="font-bold text-base text-white">
                    Official Choral Hymn Sheet
                  </h3>
                  <p className="text-xs text-amber-400 font-medium">
                    St. Cecilia's Choir of St. Michael's Church Koralawella
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sheet</span>
                </button>
                <button
                  onClick={() => setIsHymnSheetModalOpen(false)}
                  className="text-neutral-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Score Preview Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-neutral-200">
              {/* Sheet Header */}
              <div className="text-center pb-4 border-b border-[#262626] space-y-1">
                <div className="text-[11px] font-bold tracking-widest uppercase text-amber-400">
                  Order of Liturgical Music & Hymn Sheet
                </div>
                <h2 className="text-xl font-black text-white">
                  {eventTitle}
                </h2>
                <div className="text-xs text-neutral-400">
                  Authorized by President: <strong className="text-white">Joshua Peiris</strong> • St. Cecilia's Choir
                </div>
              </div>

              {/* Hymn List Table */}
              {workAndBudget.hymns.length === 0 ? (
                <div className="py-8 text-center text-neutral-500">
                  <Music className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
                  <p className="font-medium text-sm">No hymns have been added to this event yet.</p>
                  <p className="text-xs">Add hymns under Work Sub-Tab to populate the hymn sheet.</p>
                </div>
              ) : (
                <div className="border border-[#262626] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#181818] border-b border-[#262626] text-neutral-400 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Liturgical Part</th>
                        <th className="py-3 px-4">Hymn Title</th>
                        <th className="py-3 px-4">Hymnal No.</th>
                        <th className="py-3 px-4">Key</th>
                        <th className="py-3 px-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222222]">
                      {workAndBudget.hymns.map((hymn) => (
                        <tr key={hymn.id} className="hover:bg-[#181818]">
                          <td className="py-2.5 px-4 font-bold text-amber-400">
                            {hymn.category}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-white">
                            {hymn.title}
                          </td>
                          <td className="py-2.5 px-4 text-neutral-300 font-mono">
                            {hymn.hymnNumber || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-neutral-400">
                            {hymn.keySignature || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-neutral-400 italic text-[11px]">
                            {hymn.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Task / Musician assignments summary */}
              {workAndBudget.tasks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Liturgical Music Assignments
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {workAndBudget.tasks.map((task) => (
                      <div key={task.id} className="p-2.5 rounded-lg bg-[#181818] border border-[#262626] flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white">{task.duty}:</span>{' '}
                          <span className="text-amber-300">{task.assignedTo}</span>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono">{task.deadline}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer signoff note */}
              <div className="pt-4 border-t border-[#262626] flex items-center justify-between text-[11px] text-neutral-500">
                <span>St. Michael's Church, Koralawella</span>
                <span>Workflow Status: <strong className="text-emerald-400">{workAndBudget.workflowStatus || 'Draft'}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hymn Lyrics Reader Modal for Mass Service */}
      {viewingHymnLyrics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#141414] rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#2A2A2A] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#0D0D0D] border-b border-[#222222] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {viewingHymnLyrics.number > 0 && (
                    <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md font-mono text-xs font-bold">
                      #{viewingHymnLyrics.number < 10 ? `0${viewingHymnLyrics.number}` : viewingHymnLyrics.number}
                    </span>
                  )}
                  <span className="text-xs text-amber-400 font-semibold">
                    {viewingHymnLyrics.category}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {viewingHymnLyrics.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setViewingHymnLyrics(null)}
                className="p-1.5 hover:bg-[#222222] rounded-lg text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Lyrics Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-[#121212]">
              {viewingHymnLyrics.chorus && (
                <div className="bg-amber-950/30 border-l-4 border-amber-500 rounded-r-xl p-4">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5" />
                    <span>අත්වැල / ගායනා ඛණ්ඩය (Chorus)</span>
                  </div>
                  <p className="text-sm font-medium text-amber-100 whitespace-pre-line leading-relaxed">
                    {viewingHymnLyrics.chorus}
                  </p>
                </div>
              )}

              {viewingHymnLyrics.verses && viewingHymnLyrics.verses.length > 0 && (
                <div className="space-y-3">
                  {viewingHymnLyrics.verses.map((verse, vIdx) => (
                    <div key={vIdx} className="bg-[#181818] p-4 rounded-xl border border-[#262626]">
                      <span className="inline-block px-2 py-0.5 bg-[#222222] text-neutral-400 rounded text-[10px] font-bold mb-2">
                        පදය {vIdx + 1}
                      </span>
                      <p className="text-sm text-neutral-200 whitespace-pre-line leading-relaxed">
                        {verse}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {!viewingHymnLyrics.chorus && (!viewingHymnLyrics.verses || viewingHymnLyrics.verses.length === 0) && (
                <div className="text-center py-8 text-neutral-400">
                  <BookOpen className="w-10 h-10 text-amber-500/40 mx-auto mb-2" />
                  <p className="font-semibold text-white">
                    {viewingHymnLyrics.title}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    මෙම ගීතිකාවේ පදමාලාව තවමත් පද්ධතියට ඇතුළත් කර නොමැත. ({viewingHymnLyrics.book} #{viewingHymnLyrics.number})
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#0D0D0D] border-t border-[#222222] flex items-center justify-between gap-3">
              <span className="text-xs text-neutral-500 font-medium">
                {viewingHymnLyrics.book || 'කිතුනු ගීතිකා'}
              </span>

              {(viewingHymnLyrics.chorus || (viewingHymnLyrics.verses && viewingHymnLyrics.verses.length > 0)) && (
                <button
                  type="button"
                  onClick={() => {
                    let text = `✝️ ${viewingHymnLyrics.title}\n\n`;
                    if (viewingHymnLyrics.chorus) {
                      text += `[අත්වැල]\n${viewingHymnLyrics.chorus}\n\n`;
                    }
                    if (viewingHymnLyrics.verses) {
                      viewingHymnLyrics.verses.forEach((v, i) => {
                        text += `[පදය ${i + 1}]\n${v}\n\n`;
                      });
                    }
                    navigator.clipboard.writeText(text);
                    setCopiedModalLyrics(true);
                    setTimeout(() => setCopiedModalLyrics(false), 2000);
                  }}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                >
                  {copiedModalLyrics ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-950" />
                      <span>පිටපත් විය!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>පදමාලාව පිටපත් කරන්න</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
