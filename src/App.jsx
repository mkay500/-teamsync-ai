import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import "./App.css";

const initialTasks = [
  {
    id: 1,
    title: "Finalise homepage wireframes",
    project: "Website redesign",
    owner: "Alex Morgan",
    initials: "AM",
    priority: "High",
    status: "In progress",
    due: "Today",
  },
  {
    id: 2,
    title: "Review customer feedback",
    project: "Customer portal",
    owner: "Taylor N.",
    initials: "TN",
    priority: "High",
    status: "To do",
    due: "Yesterday",
    overdue: true,
  },
  {
    id: 3,
    title: "Prepare sprint progress report",
    project: "Internal operations",
    owner: "Jordan M.",
    initials: "JM",
    priority: "Medium",
    status: "In progress",
    due: "Oct 21",
  },
  {
    id: 4,
    title: "Update onboarding checklist",
    project: "Website redesign",
    owner: "Sam K.",
    initials: "SK",
    priority: "Low",
    status: "Done",
    due: "Oct 19",
  },
  {
    id: 5,
    title: "Share meeting action points",
    project: "Customer portal",
    owner: "Alex Morgan",
    initials: "AM",
    priority: "Medium",
    status: "Done",
    due: "Yesterday",
  },
  {
    id: 6,
    title: "Test task assignment flow",
    project: "Internal operations",
    owner: "Taylor N.",
    initials: "TN",
    priority: "Medium",
    status: "To do",
    due: "Oct 22",
  },
  {
    id: 7,
    title: "Review revised project scope",
    project: "Website redesign",
    owner: "Jordan M.",
    initials: "JM",
    priority: "High",
    status: "In progress",
    due: "Oct 20",
  },
  {
    id: 8,
    title: "Create customer portal prototype",
    project: "Customer portal",
    owner: "Sam K.",
    initials: "SK",
    priority: "Medium",
    status: "Done",
    due: "Oct 17",
  },
];
const navigation = [
  { label: "Dashboard", icon: "▦" },
  { label: "Projects", icon: "▤" },
  { label: "My Tasks", icon: "✓" },
  { label: "Analytics", icon: "▥" },
  { label: "AI Meeting Assistant", icon: "✦" },
  { label: "Team", icon: "♧" },
  { label: "Settings", icon: "⚙" },
];
const owners = [
  { initials: "AM", name: "Alex Morgan" },
  { initials: "TN", name: "Taylor N." },
  { initials: "JM", name: "Jordan M." },
  { initials: "SK", name: "Sam K." },
];

function App() {
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [databaseError, setDatabaseError] = useState("");
  const [session, setSession] = useState(null);
  const [teamId, setTeamId] = useState(null);
const [authLoading, setAuthLoading] = useState(true);
const [authMode, setAuthMode] = useState("signin");
const [authEmail, setAuthEmail] = useState("");
const [authPassword, setAuthPassword] = useState("");
const [authBusy, setAuthBusy] = useState(false);
const [authMessage, setAuthMessage] = useState("");
const [authError, setAuthError] = useState("");

useEffect(() => {
  let cancelled = false;

  async function loadTasks() {
    if (!session?.user?.id) {
      setTasks([]);
      setTeamId(null);
      setTasksLoading(false);
      return;
    }

    setTasksLoading(true);
    setDatabaseError("");

    try {
      const { data: membership, error: membershipError } =
        await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", session.user.id)
          .maybeSingle();

      if (membershipError) {
        throw membershipError;
      }

      if (!membership?.team_id) {
        setTeamId(null);
        setTasks([]);
        setDatabaseError(
          "Your account is not assigned to a team yet."
        );
        return;
      }

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("team_id", membership.team_id)
        .order("id", { ascending: false });

      if (error) {
        throw error;
      }

      if (!cancelled) {
        setTeamId(membership.team_id);
        setTasks(data ?? []);
        setDatabaseError("");
      }
    } catch (error) {
      console.error("Could not load team tasks:", error);

      if (!cancelled) {
        setTasks([]);
        setDatabaseError(
          error instanceof Error
            ? error.message
            : "Could not load team tasks."
        );
      }
    } finally {
      if (!cancelled) {
        setTasksLoading(false);
      }
    }
  }

  loadTasks();

  return () => {
    cancelled = true;
  };
}, [session?.user?.id]);

useEffect(() => {
  let active = true;

  async function checkSession() {
    const { data, error } = await supabase.auth.getSession();

    if (!active) return;

    if (error) {
      setAuthError(error.message);
    }

    setSession(data.session);
    setAuthLoading(false);
  }

  checkSession();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, nextSession) => {
    if (!active) return;

    setSession(nextSession);
    setAuthLoading(false);
    setAuthError("");
  });

  return () => {
    active = false;
    subscription.unsubscribe();
  };
}, []);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showTaskForm, setShowTaskForm] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newOwner, setNewOwner] = useState("AM");
  const [newDue, setNewDue] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");

  const [meetingNotes, setMeetingNotes] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
const [aiError, setAiError] = useState("");
const [meetingResult, setMeetingResult] = useState(null);
const [approvingIndex, setApprovingIndex] = useState(null);

  const completedCount = tasks.filter(
    (task) => task.status === "Done"
  ).length;

  const inProgressCount = tasks.filter(
    (task) => task.status === "In progress"
  ).length;

  const overdueCount = tasks.filter(
    (task) => task.overdue && task.status !== "Done"
  ).length;

  const completionRate = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter =
      activeFilter === "All" || task.status === activeFilter;

    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.project.toLowerCase().includes(search.toLowerCase()) ||
      task.owner.toLowerCase().includes(search.toLowerCase());

    const matchesPage =
      activeNav !== "My Tasks" || task.owner === "Alex Morgan";

    return matchesFilter && matchesSearch && matchesPage;
  });
async function createTask(event) {
  event.preventDefault();

  if (!newTitle.trim()) return;

  if (!teamId) {
    setDatabaseError(
      "Your account is not connected to a team yet."
    );
    return;
  }

  const selectedOwner =
    owners.find((owner) => owner.initials === newOwner) ||
    owners[0];

  setDatabaseError("");

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      team_id: teamId,
      creation_source: "manual",
      title: newTitle.trim(),
      project: "General",
      owner: selectedOwner.name,
      initials: selectedOwner.initials,
      priority: newPriority,
      status: "To do",
      due: newDue || "Not set",
      overdue: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Could not create task:", error);
    setDatabaseError(error.message);
    return;
  }

  setTasks((currentTasks) => [data, ...currentTasks]);
  setNewTitle("");
  setNewDue("");
  setNewPriority("Medium");
  setNewOwner("AM");
  setActiveFilter("All");
  setActiveNav("Dashboard");
  setShowTaskForm(false);
}

 async function toggleTask(taskId) {
  const task = tasks.find((item) => item.id === taskId);

  if (!task) return;

  const nextStatus =
    task.status === "Done" ? "To do" : "Done";

  setDatabaseError("");

  const { data, error } = await supabase
    .from("tasks")
    .update({ status: nextStatus })
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    console.error("Could not update task:", error);
    setDatabaseError(error.message);
    return;
  }

  setTasks((currentTasks) =>
    currentTasks.map((item) =>
      item.id === taskId ? data : item
    )
  );
}
async function generateMeetingSummary() {
  const notes = meetingNotes.trim();

  if (!notes) {
    setAiError("Please enter your meeting notes first.");
    return;
  }

  setAiLoading(true);
  setAiError("");
  setMeetingResult(null);

  try {
    const { data, error } = await supabase.functions.invoke(
      "meeting-assistant",
      {
        body: { notes },
      }
    );

    if (error) {
      throw new Error(error.message || "The AI request failed.");
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    setMeetingResult({
      summary: data.summary || "",
      decisions: Array.isArray(data.decisions)
        ? data.decisions
        : [],
      actionItems: Array.isArray(data.actionItems)
        ? data.actionItems.map((item) => ({
            ...item,
            approved: false,
          }))
        : [],
    });
  } catch (error) {
    console.error("Meeting assistant error:", error);
    setAiError(
      error.message || "Unable to generate meeting results."
    );
  } finally {
    setAiLoading(false);
  }
}

async function approveActionItem(item, index) {
  if (item.approved || approvingIndex !== null) return;

  setApprovingIndex(index);
  setAiError("");

  try {
    const requestedOwner =
      typeof item.owner === "string" ? item.owner.trim() : "";

    const matchedOwner = owners.find((person) => {
      const requested = requestedOwner.toLowerCase();

      return (
        requested &&
        (
          person.name.toLowerCase() === requested ||
          person.name.toLowerCase().split(" ")[0] === requested
        )
      );
    }) || owners[0];

    const taskToSave = {
      team_id: teamId,                    // ADD
  creation_source: "ai_assisted",
      title: item.title,
      project: "General",
      owner: matchedOwner.name,
      initials: matchedOwner.initials,
      priority: ["Low", "Medium", "High"].includes(item.priority)
        ? item.priority
        : "Medium",
      status: "To do",
      due: item.due || "Not set",
      overdue: false,
    };

    const { data, error } = await supabase
      .from("tasks")
      .insert(taskToSave)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    setTasks((currentTasks) => [data, ...currentTasks]);

    setMeetingResult((current) =>
      current
        ? {
            ...current,
            actionItems: current.actionItems.map((suggestion, i) =>
              i === index
                ? { ...suggestion, approved: true }
                : suggestion
            ),
          }
        : current
    );
  } catch (error) {
    console.error("Could not approve task:", error);
    setAiError(error.message || "Could not save the task.");
  } finally {
    setApprovingIndex(null);
  }
}

 async function handleAuthSubmit(event) {
  event.preventDefault();

  setAuthBusy(true);
  setAuthError("");
  setAuthMessage("");

  try {
    const email = authEmail.trim();

    if (authMode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: authPassword,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      if (data.session) {
        setSession(data.session);
        setAuthMessage("Your account has been created.");
      } else {
        setAuthMessage(
          "Account created. Check your email to confirm your account, then sign in."
        );
      }
    } else {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password: authPassword,
        });

      if (error) throw error;

      setSession(data.session);
      setAuthMessage("Signed in successfully.");
    }
  } catch (error) {
    setAuthError(
      error instanceof Error
        ? error.message
        : "Authentication failed."
    );
  } finally {
    setAuthBusy(false);
  }
}
async function handleSignOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    setAuthError(error.message);
  }
}
  const taskPanel = (
    <section className="panel tasks-panel">
      <div className="panel-heading">
        <div>
          <div className="heading-with-count">
            <h2>{activeNav === "My Tasks" ? "My tasks" : "Recent tasks"}</h2>
            <span className="count-pill">{filteredTasks.length}</span>
          </div>
          <p className="muted-text">
            Track responsibilities and keep work moving.
          </p>
        </div>

        <button
          className="text-button"
          onClick={() => setActiveNav("My Tasks")}
        >
          My tasks <span>→</span>
        </button>
      </div>

      <div className="task-toolbar">
        <div className="filter-list">
          {["All", "In progress", "To do", "Done"].map((filter) => (
            <button
              key={filter}
              className={`filter-chip ${
                activeFilter === filter ? "selected" : ""
              }`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <input
          className="search-input"
          type="search"
          placeholder="Search tasks..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search tasks"
        />
      </div>

      <div className="task-table-scroll">
        <div className="task-table">
          <div className="task-table-header">
            <span>Task</span>
            <span>Owner</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Due date</span>
            <span>Done</span>
          </div>

          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div className="task-row" key={task.id}>
                <div className="task-title-cell">
                  <div
                    className={`task-indicator ${
                      task.status === "Done" ? "is-done" : ""
                    }`}
                  >
                    {task.status === "Done" ? "✓" : ""}
                  </div>

                  <div className="task-title-info">
                    <span
                      className={
                        task.status === "Done" ? "completed-title" : ""
                      }
                    >
                      {task.title}
                    </span>
                    <small>{task.project}</small>
                  </div>
                </div>

                <div className="owner-cell">
                  <span className={`avatar avatar-${task.initials.toLowerCase()}`}>
                    {task.initials}
                  </span>
                  <span>{task.owner.split(" ")[0]}</span>
                </div>

                <div>
                  <span
                    className={`priority priority-${task.priority.toLowerCase()}`}
                  >
                    {task.priority}
                  </span>
                </div>

                <div>
                  <span
                    className={`status status-${task.status
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {task.status}
                  </span>
                </div>

                <span
                  className={
                    task.overdue && task.status !== "Done"
                      ? "due-date overdue"
                      : "due-date"
                  }
                >
                  {task.overdue && task.status !== "Done" ? "Late · " : ""}
                  {task.due}
                </span>

                <button
                  className={`done-button ${
                    task.status === "Done" ? "done-button-active" : ""
                  }`}
                  onClick={() => toggleTask(task.id)}
                  title={
                    task.status === "Done"
                      ? "Reopen task"
                      : "Mark task as done"
                  }
                  aria-label={
                    task.status === "Done"
                      ? "Reopen task"
                      : "Mark task as done"
                  }
                >
                  {task.status === "Done" ? "↶" : "✓"}
                </button>
              </div>
            ))
          ) : (
            <div className="empty-state">
              No tasks match your search or selected filter.
            </div>
          )}
        </div>
      </div>

      <div className="task-panel-footer">
        <span>Sample workspace data</span>
        <button
          className="text-button"
          onClick={() => setShowTaskForm(true)}
        >
          + Add a task
        </button>
      </div>
    </section>
  );

  if (authLoading) {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      Checking your session...
    </div>
  );
}

if (!session) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "#f6f7fb",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 420,
          padding: 32,
          background: "white",
          border: "1px solid #e9ebf2",
          borderRadius: 16,
        }}
      >
        <h1 style={{ marginTop: 0, color: "#6255e9" }}>
          TeamSync AI
        </h1>

        <p style={{ color: "#777d91", fontSize: 13 }}>
          Sign in to your team workspace.
        </p>

        <h2 style={{ fontSize: 20 }}>
          {authMode === "signin" ? "Welcome back" : "Create an account"}
        </h2>

        <form
          onSubmit={handleAuthSubmit}
          style={{ display: "grid", gap: 16 }}
        >
          <label className="form-field">
            Email address
            <input
              type="email"
              required
              autoComplete="email"
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="form-field">
            Password
            <input
              type="password"
              required
              minLength={6}
              autoComplete={
                authMode === "signin"
                  ? "current-password"
                  : "new-password"
              }
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
              placeholder="Enter your password"
            />
          </label>

          {authError && (
            <p role="alert" style={{ color: "#b42318", fontSize: 12 }}>
              {authError}
            </p>
          )}

          {authMessage && (
            <p role="status" style={{ color: "#27885e", fontSize: 12 }}>
              {authMessage}
            </p>
          )}

          <button className="primary-button" disabled={authBusy}>
            {authBusy
              ? "Please wait..."
              : authMode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <button
          type="button"
          className="text-button"
          style={{ marginTop: 20 }}
          onClick={() => {
            setAuthMode(
              authMode === "signin" ? "signup" : "signin"
            );
            setAuthError("");
            setAuthMessage("");
          }}
        >
          {authMode === "signin"
            ? "New here? Create an account"
            : "Already registered? Sign in"}
        </button>
      </section>
    </div>
  );
}
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">T</div>
          <div className="brand-name">
            <strong>TeamSync</strong>
            <span>AI COLLABORATION</span>
          </div>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-icon">W</div>
          <div>
            <strong>Workspace One</strong>
            <span>Team workspace</span>
          </div>
          <span className="switcher-arrow">⌄</span>
        </div>

        <p className="nav-label">WORKSPACE</p>

        <nav className="navigation">
          {navigation.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${
                activeNav === item.label ? "nav-item-active" : ""
              }`}
              onClick={() => setActiveNav(item.label)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.label === "AI Meeting Assistant" && (
                <span className="new-badge">AI</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">✦</div>
            <strong>Work better together</strong>
            <p>Keep tasks, decisions and progress in one place.</p>
          </div>

          <div className="profile">
            <div className="profile-avatar">AM</div>
            <div className="profile-details">
              <strong>Alex Morgan</strong>
              <span>Project lead · Demo user</span>
            </div>
            <span className="profile-menu">•••</span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            Workspace <span>/</span> <strong>{activeNav}</strong>
          </div>

          <div className="topbar-right">
            <span className="demo-badge">
              <span className="demo-dot"></span>
              Prototype
            </span>
            <button
              className="notification-button"
              title="Notifications"
              aria-label="Notifications"
            >
              ♧
              <span></span>
            </button>
            <button
  type="button"
  className="text-button"
  onClick={handleSignOut}
>
  Sign out
</button>
            <div className="topbar-avatar">AM</div>
          </div>
        </header>

        <div className="page-content">
          {databaseError && (
  <div
    role="alert"
    style={{
      color: "#b42318",
      background: "#fff0ef",
      padding: "12px",
      borderRadius: "8px",
      marginBottom: "16px",
    }}
  >
    Could not load tasks: {databaseError}
  </div>
)}
          {activeNav === "Dashboard" && (
            <>
              <div className="welcome-row">
                <div>
                  <p className="eyebrow">TEAM OVERVIEW</p>
                  <h1>Good morning, team <span>✦</span></h1>
                  <p className="welcome-subtitle">
                    Here's what's happening across your workspace.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => setShowTaskForm(true)}
                >
                  <span>＋</span> New task
                </button>
              </div>

              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-top">
                    <span className="metric-icon purple-icon">▦</span>
                    <span className="metric-label">Total tasks</span>
                  </div>
                  <div className="metric-number">{tasks.length}</div>
                  <div className="metric-footnote">Across the workspace</div>
                </div>

                <div className="metric-card">
                  <div className="metric-top">
                    <span className="metric-icon green-icon">✓</span>
                    <span className="metric-label">Completed</span>
                  </div>
                  <div className="metric-number">{completedCount}</div>
                  <div className="metric-footnote">
                    {completionRate}% of all tasks
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-top">
                    <span className="metric-icon blue-icon">◷</span>
                    <span className="metric-label">In progress</span>
                  </div>
                  <div className="metric-number">{inProgressCount}</div>
                  <div className="metric-footnote">Currently being worked on</div>
                </div>

                <div className="metric-card">
                  <div className="metric-top">
                    <span className="metric-icon orange-icon">!</span>
                    <span className="metric-label">Overdue tasks</span>
                  </div>
                  <div className="metric-number">{overdueCount}</div>
                  <div className="metric-footnote">Need attention</div>
                </div>
              </div>

              <div className="dashboard-grid">
                <div className="main-column">{taskPanel}</div>

                <div className="side-column">
                  <section className="panel progress-panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Team progress</h2>
                        <p className="muted-text">
                          Completion across all sample tasks.
                        </p>
                      </div>
                      <span className="small-menu">•••</span>
                    </div>

                    <div className="progress-summary">
                      <div
                        className="progress-donut"
                        style={{ "--progress": `${completionRate}%` }}
                      >
                        <div className="donut-inner">
                          <strong>{completionRate}%</strong>
                          <span>complete</span>
                        </div>
                      </div>

                      <div className="progress-legend">
                        <div>
                          <span className="legend-dot completed-dot"></span>
                          <span>Completed</span>
                          <strong>{completedCount}</strong>
                        </div>
                        <div>
                          <span className="legend-dot progress-dot"></span>
                          <span>In progress</span>
                          <strong>{inProgressCount}</strong>
                        </div>
                        <div>
                          <span className="legend-dot todo-dot"></span>
                          <span>To do</span>
                          <strong>
                            {tasks.filter((task) => task.status === "To do").length}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="progress-note">
                      <span className="note-sparkle">✦</span>
                      <p>
                        Keep tasks up to date to get a clearer picture of your
                        team's progress.
                      </p>
                    </div>
                  </section>

                  <section className="ai-card">
                    <div className="ai-card-top">
                      <div className="ai-symbol">✦</div>
                      <span className="coming-soon">COMING NEXT</span>
                    </div>
                    <h2>Meet your AI assistant</h2>
                    <p>
                      Turn meeting notes into summaries, decisions and suggested
                      action items for your team to review.
                    </p>
                    <button
                      className="ai-link"
                      onClick={() => setActiveNav("AI Meeting Assistant")}
                    >
                      Explore AI assistant <span>→</span>
                    </button>
                  </section>
                </div>
              </div>
            </>
          )}

          {activeNav === "My Tasks" && (
            <>
              <div className="welcome-row">
                <div>
                  <p className="eyebrow">PERSONAL WORKSPACE</p>
                  <h1>My tasks</h1>
                  <p className="welcome-subtitle">
                    Tasks assigned to the demo user, Alex Morgan.
                  </p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => setShowTaskForm(true)}
                >
                  <span>＋</span> New task
                </button>
              </div>
              {taskPanel}
            </>
          )}

          {activeNav === "AI Meeting Assistant" && (
            <>
              <div className="welcome-row">
                <div>
                  <p className="eyebrow">HUMAN + AI COLLABORATION</p>
                  <h1>AI Meeting Assistant <span>✦</span></h1>
                  <p className="welcome-subtitle">
                    A workspace for turning team discussions into actions.
                  </p>
                </div>
              </div>

              <div className="ai-workspace-grid">
                <section className="panel notes-panel">
  <span className="metric-icon purple-icon">✦</span>

  <h2>AI Meeting Assistant</h2>

  <p className="muted-text">
    Turn team discussions into clear decisions and suggested tasks.
    Review the AI's suggestions before adding them to your workspace.
  </p>

  <label
    htmlFor="meeting-notes-input"
    className="form-field"
    style={{ marginTop: "20px" }}
  >
    Meeting notes

    <textarea
      id="meeting-notes-input"
      className="meeting-textarea"
      value={meetingNotes}
      onChange={(event) => setMeetingNotes(event.target.value)}
      placeholder="Example: We agreed to finish the prototype by Friday. Alex will update the design, and Taylor will test the task workflow by Thursday."
    />
  </label>

  <button
    type="button"
    className="primary-button"
    style={{ marginTop: "16px" }}
    onClick={generateMeetingSummary}
    disabled={aiLoading}
  >
    {aiLoading ? "Analysing meeting notes..." : "✦ Generate meeting summary"}
  </button>

  {aiError && (
    <div
      role="alert"
      style={{
        marginTop: "16px",
        padding: "12px",
        borderRadius: "9px",
        background: "#fff0ef",
        color: "#b42318",
        fontSize: "12px",
        lineHeight: 1.6,
      }}
    >
      {aiError}
    </div>
  )}

  {meetingResult && (
    <div style={{ marginTop: "28px" }}>
      <div
        style={{
          borderTop: "1px solid #eceef4",
          paddingTop: "22px",
        }}
      >
        <p className="eyebrow">AI-GENERATED RESULTS</p>

        <h2>Meeting summary</h2>

        <p
          style={{
            color: "#656b80",
            fontSize: "12px",
            lineHeight: 1.8,
            marginTop: "10px",
            whiteSpace: "pre-wrap",
          }}
        >
          {meetingResult.summary || "No summary was returned."}
        </p>

        <h2 style={{ marginTop: "24px" }}>Decisions</h2>

        {meetingResult.decisions.length > 0 ? (
          <ul style={{ paddingLeft: "20px", color: "#656b80", fontSize: "12px", lineHeight: 1.9 }}>
            {meetingResult.decisions.map((decision, index) => (
              <li key={`${decision}-${index}`}>{decision}</li>
            ))}
          </ul>
        ) : (
          <p className="muted-text">No decisions were identified.</p>
        )}

        <h2 style={{ marginTop: "24px" }}>Suggested action items</h2>

        <p className="muted-text">
          Review each suggestion. Only approved tasks are saved to your task board.
        </p>

        {meetingResult.actionItems.length > 0 ? (
          <div style={{ display: "grid", gap: "12px", marginTop: "14px" }}>
            {meetingResult.actionItems.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                style={{
                  border: "1px solid #e7e8f0",
                  borderRadius: "12px",
                  padding: "15px",
                  background: "#fdfdff",
                }}
              >
                <strong
                  style={{
                    display: "block",
                    color: "#30354b",
                    fontSize: "12px",
                    lineHeight: 1.6,
                  }}
                >
                  {item.title}
                </strong>

                <div
                  style={{
                    display: "grid",
                    gap: "5px",
                    marginTop: "10px",
                    color: "#777d92",
                    fontSize: "11px",
                  }}
                >
                  <span>Suggested owner: {item.owner || "Not specified"}</span>
                  <span>Deadline: {item.due || "Not specified"}</span>
                  <span>Priority: {item.priority}</span>
                </div>

                <button
                  type="button"
                  className={
                    item.approved ? "secondary-button" : "primary-button"
                  }
                  style={{ marginTop: "13px" }}
                  disabled={item.approved || approvingIndex !== null}
                  onClick={() => approveActionItem(item, index)}
                >
                  {item.approved
                    ? "✓ Added to tasks"
                    : approvingIndex === index
                      ? "Saving task..."
                      : "Approve & add task"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted-text">
            The AI did not suggest any action items for these notes.
          </p>
        )}
      </div>
    </div>
  )}
</section>

                <section className="panel workflow-panel">
                  <h2>How it will work</h2>
                  <p className="muted-text">
                    Team members will stay in control of the decisions.
                  </p>

                  <div className="workflow-step">
                    <span className="workflow-number">1</span>
                    <div>
                      <strong>Summarise</strong>
                      <p>AI drafts a short meeting summary.</p>
                    </div>
                  </div>

                  <div className="workflow-step">
                    <span className="workflow-number">2</span>
                    <div>
                      <strong>Suggest action items</strong>
                      <p>AI identifies possible tasks and deadlines.</p>
                    </div>
                  </div>

                  <div className="workflow-step">
                    <span className="workflow-number">3</span>
                    <div>
                      <strong>Human review</strong>
                      <p>Team members edit or approve each suggestion.</p>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}

{activeNav === "Analytics" && (
  <>
    <div className="welcome-row">
      <div>
        <p className="eyebrow">TEAM PERFORMANCE</p>
        <h1>Productivity Analytics</h1>
        <p className="welcome-subtitle">
          Monitor team performance and understand the contribution
          of AI-assisted collaboration.
        </p>
      </div>
    </div>

    <div style={{
      display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
      gap: "16px",
      marginBottom: "24px"
    }}>

      <section className="panel analytics-metric-card">
        <p className="eyebrow">TOTAL TASKS</p>
        <h1>{tasks.length}</h1>
        <p className="muted-text">Tasks recorded by your team</p>
      </section>

      <section className="panel analytics-metric-card">
        <p className="eyebrow">COMPLETED TASKS</p>
        <h1>
          {tasks.filter(task =>
            ["done", "completed"].includes(
              (task.status || "").toLowerCase()
            )
          ).length}
        </h1>
        <p className="muted-text">Successfully completed</p>
      </section>

      <section className="panel analytics-metric-card">
        <p className="eyebrow">AI-ASSISTED TASKS</p>
        <h1>
          {tasks.filter(task =>
            task.creation_source === "ai_assisted"
          ).length}
        </h1>
        <p className="muted-text">Tasks created through AI assistance</p>
      </section>

      <section className="panel analytics-metric-card">
        <p className="eyebrow">OVERDUE TASKS</p>
        <h1>
          {tasks.filter(task => task.overdue === true).length}
        </h1>
        <p className="muted-text">Tasks requiring attention</p>
      </section>

    </div>

    <section className="panel" style={{ marginBottom: "20px" }}>
      <h2>Task completion performance</h2>

      <p className="muted-text">
        Compare completion outcomes for manual and AI-assisted tasks.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "25px",
        marginTop: "24px"
      }}>

        <div>
          <strong>Manual tasks</strong>

          <h1>
            {(() => {
              const group = tasks.filter(
                task => task.creation_source === "manual"
              );
              const completed = group.filter(task =>
                ["done", "completed"].includes(
                  (task.status || "").toLowerCase()
                )
              ).length;

              return group.length
                ? `${Math.round(completed / group.length * 100)}%`
                : "No data";
            })()}
          </h1>

          <p className="muted-text">
            Completion rate for manually created tasks.
          </p>
        </div>

        <div>
          <strong>AI-assisted tasks</strong>

          <h1>
            {(() => {
              const group = tasks.filter(
                task => task.creation_source === "ai_assisted"
              );
              const completed = group.filter(task =>
                ["done", "completed"].includes(
                  (task.status || "").toLowerCase()
                )
              ).length;

              return group.length
                ? `${Math.round(completed / group.length * 100)}%`
                : "No data";
            })()}
          </h1>

          <p className="muted-text">
            Completion rate for AI-assisted tasks.
          </p>
        </div>

      </div>
    </section>

    <section className="panel">
      <h2>Average task completion time</h2>

      <h1>
        {(() => {
          const completed = tasks.filter(
            task => task.completed_at && task.created_at
          );

          if (!completed.length) return "No data yet";

          const averageSeconds = completed.reduce(
            (total, task) => {
              const elapsed =
                (new Date(task.completed_at).getTime() -
                 new Date(task.created_at).getTime()) / 1000;

              return total + Math.max(0, elapsed);
            },
            0
          ) / completed.length;

          return averageSeconds < 60
            ? `${averageSeconds.toFixed(1)} seconds`
            : `${(averageSeconds / 60).toFixed(1)} minutes`;
        })()}
      </h1>

      <p className="muted-text">
        Average elapsed time between task creation and completion.
        This measures elapsed time, not active working time.
      </p>
    </section>

  </>
)}

          {!["Dashboard", "My Tasks", "AI Meeting Assistant"].includes(
            activeNav
          ) && (
            <section className="panel placeholder-page">
              <div className="placeholder-icon">▦</div>
              <p className="eyebrow">TEAMSYNC WORKSPACE</p>
              <h1>{activeNav}</h1>
              <p className="welcome-subtitle">
                This section will be developed after the core task workflow.
                For the first prototype, we're focusing on team tasks, progress
                tracking and AI-supported coordination.
              </p>
              <button
                className="primary-button"
                onClick={() => setActiveNav("Dashboard")}
              >
                ← Back to dashboard
              </button>
            </section>
          )}
        </div>
      </main>

      {showTaskForm && (
        <div className="modal-overlay">
          <section
            className="task-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-task-title"
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">TEAM WORKSPACE</p>
                <h2 id="new-task-title">Create a task</h2>
              </div>
              <button
                className="close-button"
                onClick={() => setShowTaskForm(false)}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form onSubmit={createTask}>
              <label className="form-field">
                Task name
                <input
                  autoFocus
                  required
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder="What needs to be done?"
                />
              </label>

              <div className="form-row">
                <label className="form-field">
                  Assign to
                  <select
                    value={newOwner}
                    onChange={(event) => setNewOwner(event.target.value)}
                  >
                    {owners.map((owner) => (
                      <option key={owner.initials} value={owner.initials}>
                        {owner.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  Priority
                  <select
                    value={newPriority}
                    onChange={(event) => setNewPriority(event.target.value)}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </label>
              </div>

              <label className="form-field">
                Due date
                <input
                  value={newDue}
                  onChange={(event) => setNewDue(event.target.value)}
                  placeholder="e.g. Oct 23"
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowTaskForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Create task
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;