import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Upload,
  Search,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  Edit2,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AdminPageHeader } from '@/components/admin'
import { StatCard } from '@/components/admin/stat-card'
import { useEventDetail, useTeams, usePreviewTeams, useImportTeams, useUpdateTeam, useDeleteTeam, useClearTeams } from '@/hooks'
import { eventApi } from '@/services'
import { fadeInUp, staggerContainer } from '@/config/animations'
import type { EventTeam } from '@/types'
import toast from 'react-hot-toast'

export default function TeamsManagementPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: event, isLoading: loadingEvent, refetch: refetchEvent } = useEventDetail(id || '')

  // State
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'purchased' | 'remaining'>('all')

  // Query Teams
  const { data: teamsData, isLoading: loadingTeams, refetch: refetchTeams } = useTeams(id || '', {
    page,
    limit: 10,
    search: search || undefined,
    status: statusFilter,
  })

  const teamsList = teamsData?.teams || []
  const stats = teamsData?.stats || { totalTeams: 0, purchasedTeams: 0, remainingTeams: 0 }
  const pagination = teamsData?.pagination

  // Mutations
  const previewMutation = usePreviewTeams()
  const importMutation = useImportTeams()
  const updateMutation = useUpdateTeam()
  const deleteMutation = useDeleteTeam()
  const clearMutation = useClearTeams()

  // CSV Upload/Preview modal state
  const [previewRows, setPreviewRows] = useState<{ teamId: string; leaderName: string; status: string }[] | null>(null)
  const [fileName, setFileName] = useState('')

  // Edit inline state
  const [editingTeam, setEditingTeam] = useState<EventTeam | null>(null)
  const [editingLeaderName, setEditingLeaderName] = useState('')

  // Handle CSV file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file.')
      return
    }

    setFileName(file.name)
    previewMutation.mutate(
      { eventId: id, file },
      {
        onSuccess: (data) => {
          setPreviewRows(data)
        },
      }
    )
  }

  // Handle Drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Handle Drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file || !id) return

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file.')
      return
    }

    setFileName(file.name)
    previewMutation.mutate(
      { eventId: id, file },
      {
        onSuccess: (data) => {
          setPreviewRows(data)
        },
      }
    )
  }

  // Import previewed teams
  const handleConfirmImport = () => {
    if (!id || !previewRows) return
    const validTeams = previewRows.filter((r) => r.status === 'Valid')

    if (validTeams.length === 0) {
      toast.error('No valid teams found to import.')
      return
    }

    importMutation.mutate(
      { eventId: id, teams: validTeams },
      {
        onSuccess: (res: any) => {
          setPreviewRows(null)
          setFileName('')
          refetchTeams()
          refetchEvent()
          toast.success(
            `Successfully imported ${res.importedCount} teams. Skipped ${res.skippedCount} rows.`
          )
        },
      }
    )
  }

  // Export CSV
  const handleExportCSV = async () => {
    if (!id) return
    try {
      toast.loading('Preparing CSV export...', { id: 'export-csv' })
      const res = await eventApi.getTeams(id, { limit: 1000 })
      const allTeams = (res.data.data as any).teams || []

      if (allTeams.length === 0) {
        toast.dismiss('export-csv')
        toast.error('No teams available to export.')
        return
      }

      const headers = ['Team ID', 'Leader Name', 'Purchase Status', 'Purchase Date'].join(',')
      const rows = allTeams.map((team: EventTeam) => [
        team.teamId,
        `"${team.leaderName.replace(/"/g, '""')}"`,
        team.purchased ? 'Purchased' : 'Eligible',
        team.purchasedAt ? new Date(team.purchasedAt).toISOString() : '',
      ].join(','))

      const csvContent = [headers, ...rows].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `event_${id}_teams_list.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('CSV exported successfully!', { id: 'export-csv' })
    } catch (err) {
      toast.dismiss('export-csv')
      toast.error('Failed to export CSV.')
    }
  }

  // Delete team
  const handleDeleteTeam = (teamId: string) => {
    if (!id) return
    if (window.confirm(`Are you sure you want to delete team ${teamId}?`)) {
      deleteMutation.mutate(
        { eventId: id, teamId },
        {
          onSuccess: () => {
            refetchTeams()
            refetchEvent()
          },
        }
      )
    }
  }

  // Edit team click
  const handleStartEdit = (team: EventTeam) => {
    setEditingTeam(team)
    setEditingLeaderName(team.leaderName)
  }

  // Save leader name
  const handleSaveEdit = () => {
    if (!id || !editingTeam) return
    if (!editingLeaderName.trim()) {
      toast.error('Leader name cannot be empty.')
      return
    }
    updateMutation.mutate(
      { eventId: id, teamId: editingTeam.teamId, leaderName: editingLeaderName },
      {
        onSuccess: () => {
          setEditingTeam(null)
          setEditingLeaderName('')
          refetchTeams()
        },
      }
    )
  }

  // Clear all non-purchased teams
  const handleClearTeams = () => {
    if (!id) return
    if (window.confirm('Are you sure you want to clear all teams? Teams that have already purchased the kit will not be affected.')) {
      clearMutation.mutate(id, {
        onSuccess: () => {
          refetchTeams()
          refetchEvent()
        },
      })
    }
  }

  if (loadingEvent) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Team Management"
        description={`Import & manage eligible student teams for event: ${event?.eventName}`}
        action={
          <Button variant="outline" onClick={() => navigate(`/organizer/events/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Event Details
          </Button>
        }
      />

      {/* 1. Statistics Cards */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={fadeInUp}>
          <StatCard
            title="Total Teams"
            value={stats.totalTeams}
            icon={Users}
            iconColor="primary"
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <StatCard
            title="Imported Teams"
            value={stats.totalTeams}
            icon={Upload}
            iconColor="info"
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <StatCard
            title="Purchased Teams"
            value={stats.purchasedTeams}
            icon={CheckCircle}
            iconColor="success"
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <StatCard
            title="Remaining Teams"
            value={stats.remainingTeams}
            icon={Clock}
            iconColor="warning"
          />
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle: Team search & Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base font-semibold">Teams Registered</CardTitle>
              <div className="flex gap-2">
                {stats.totalTeams > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export CSV
                  </Button>
                )}
                {stats.totalTeams > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearTeams}
                    loading={clearMutation.isPending}
                    className="text-destructive border-destructive/20 hover:bg-destructive/10"
                  >
                    Clear Teams List
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search & Filter bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by Team ID or Leader Name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  {(['all', 'purchased', 'remaining'] as const).map((filter) => (
                    <Button
                      key={filter}
                      variant={statusFilter === filter ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setStatusFilter(filter)
                        setPage(1)
                      }}
                      className="capitalize"
                    >
                      {filter}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Table */}
              {loadingTeams ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : teamsList.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm font-medium">No teams found</p>
                  <p className="text-xs mt-1">Upload a CSV file of teams on the right panel to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-border rounded-xl bg-card">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-left">
                        <th className="p-3 font-semibold text-muted-foreground">Team ID</th>
                        <th className="p-3 font-semibold text-muted-foreground">Leader Name</th>
                        <th className="p-3 font-semibold text-muted-foreground">Status</th>
                        <th className="p-3 font-semibold text-muted-foreground text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {teamsList.map((team: EventTeam) => (
                        <tr key={team.teamId} className="hover:bg-muted/10 transition-colors">
                          <td className="p-3 font-medium text-foreground">{team.teamId}</td>
                          <td className="p-3">
                            {editingTeam?.teamId === team.teamId ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editingLeaderName}
                                  onChange={(e) => setEditingLeaderName(e.target.value)}
                                  className="h-8 py-0.5"
                                />
                                <Button size="sm" onClick={handleSaveEdit} className="h-8">
                                  Save
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingTeam(null)} className="h-8">
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">{team.leaderName}</span>
                            )}
                          </td>
                          <td className="p-3">
                            {team.purchased ? (
                              <div className="flex flex-col items-start gap-1">
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/10 rounded-full px-2.5 py-0.5">
                                  <CheckCircle className="h-3 w-3" />
                                  Purchased
                                </span>
                                {team.purchasedAt && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(team.purchasedAt).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
                                <Clock className="h-3 w-3" />
                                Eligible
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex gap-1 justify-end">
                              {!team.purchased ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStartEdit(team)}
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteTeam(team.teamId)}
                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground italic px-2">Locked</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasPrevPage}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNextPage}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right side: CSV Upload & Audit History */}
        <div className="space-y-6">
          {/* 1. CSV Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                Import Teams list
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all relative overflow-hidden"
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs font-semibold text-foreground">Click to upload CSV or drag file here</p>
                <p className="text-[10px] text-muted-foreground mt-1">Expected format: TEAM_ID,LEADER_NAME</p>
              </div>

              <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">CSV Template format:</p>
                <pre className="bg-muted p-1.5 rounded text-[10px] text-foreground font-mono">
                  BOT001,Rahul Kumar{'\n'}
                  BOT002,Priya Singh{'\n'}
                  BOT003,Amit Verma
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* 2. Audit Import Card */}
          {event?.latestImport && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Latest Import Audit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Imported At</span>
                  <span className="font-medium text-foreground">
                    {new Date(event.latestImport.importedAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Imported By</span>
                  <span className="font-medium text-foreground">
                    {typeof event.latestImport.importedBy === 'object'
                      ? `${(event.latestImport.importedBy as any).firstName} ${(event.latestImport.importedBy as any).lastName}`
                      : 'Organizer'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Rows Processed</span>
                  <span className="font-semibold text-foreground">{event.latestImport.totalRows}</span>
                </div>
                <div className="flex justify-between text-success">
                  <span>Successfully Imported</span>
                  <span className="font-semibold">{event.latestImport.successRows}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>Skipped Rows</span>
                  <span className="font-semibold">{event.latestImport.skippedRows}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* CSV Preview Dialog / Modal */}
      <AnimatePresence>
        {previewRows && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background rounded-2xl max-w-2xl w-full border border-border overflow-hidden max-h-[85vh] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-4.5 w-4.5 text-primary" />
                    CSV Import Preview
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">File: {fileName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewRows(null)
                    setFileName('')
                  }}
                  className="rounded-full hover:bg-muted p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 space-y-3">
                <div className="text-xs text-muted-foreground flex gap-3 flex-wrap">
                  <span className="bg-success/15 text-success rounded px-2 py-0.5">
                    Valid: {previewRows.filter((r) => r.status === 'Valid').length}
                  </span>
                  <span className="bg-destructive/15 text-destructive rounded px-2 py-0.5">
                    Invalid/Duplicate: {previewRows.filter((r) => r.status !== 'Valid').length}
                  </span>
                  <span className="bg-muted p-1 text-[10px] text-foreground rounded">
                    Total Rows: {previewRows.length}
                  </span>
                </div>

                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted text-left border-b border-border">
                        <th className="p-2.5 font-semibold">Team ID</th>
                        <th className="p-2.5 font-semibold">Leader Name</th>
                        <th className="p-2.5 font-semibold">Validation Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium">
                      {previewRows.map((row, idx) => {
                        const isValid = row.status === 'Valid'
                        return (
                          <tr key={idx} className={isValid ? 'hover:bg-muted/10' : 'bg-destructive/5 text-destructive/90'}>
                            <td className="p-2.5">{row.teamId || <span className="italic text-muted-foreground/50">&lt;Empty&gt;</span>}</td>
                            <td className="p-2.5">{row.leaderName || <span className="italic text-muted-foreground/50">&lt;Empty&gt;</span>}</td>
                            <td className="p-2.5">
                              {isValid ? (
                                <span className="inline-flex items-center gap-1 text-success">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-semibold">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  {row.status}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 border-t border-border flex justify-end gap-3 bg-muted/10">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPreviewRows(null)
                    setFileName('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmImport}
                  loading={importMutation.isPending}
                  disabled={previewRows.filter((r) => r.status === 'Valid').length === 0}
                >
                  Import Valid Rows
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
