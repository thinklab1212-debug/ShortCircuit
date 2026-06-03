import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { Ban, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { userApi } from '@/services'
import { DataTable, TablePagination, AdminPageHeader } from '@/components/admin'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { ErrorFallback } from '@/components/ui/error'
import { getUserName, formatDate } from '@/utils'
import type { User } from '@/types'

interface ApiError {
  response?: { data?: { message?: string } }
}

const LIMIT = 12

export default function UsersAdminPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'users', page],
    queryFn: async () => (await userApi.getAll({ page, limit: LIMIT })).data,
    placeholderData: keepPreviousData,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })

  const blockMutation = useMutation({
    mutationFn: (id: string) => userApi.toggleBlock(id),
    onSuccess: () => {
      toast.success('User status updated')
      invalidate()
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Failed to update user'),
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'customer' | 'admin' }) =>
      userApi.changeRole(id, role),
    onSuccess: () => {
      toast.success('Role updated')
      invalidate()
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Failed to change role'),
  })

  const handleToggleBlock = (user: User) => {
    const action = user.isBlocked ? 'unblock' : 'block'
    if (window.confirm(`Are you sure you want to ${action} ${getUserName(user) || user.email}?`)) {
      blockMutation.mutate(user._id)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'User',
      render: (row: User) => (
        <div>
          <p className="font-medium text-foreground">{getUserName(row) || '—'}</p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row: User) => <span className="text-muted-foreground">{row.phone || '—'}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (row: User) => (
        <Badge variant={row.role === 'admin' ? 'gradient' : 'secondary'} size="sm">
          {row.role === 'admin' ? 'Admin' : 'Customer'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: User) =>
        row.isBlocked ? (
          <Badge variant="destructive" size="sm">
            Blocked
          </Badge>
        ) : (
          <Badge variant="success" size="sm">
            Active
          </Badge>
        ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (row: User) => <span className="text-muted-foreground">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (row: User) => (
        <div className="flex items-center justify-end gap-2">
          <Select
            value={row.role}
            onChange={(e) => roleMutation.mutate({ id: row._id, role: e.target.value as 'customer' | 'admin' })}
            className="h-8 w-32 text-xs"
            aria-label="Change role"
          >
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </Select>
          <Button
            variant={row.isBlocked ? 'soft-success' : 'soft-destructive'}
            size="sm"
            leftIcon={row.isBlocked ? <ShieldCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
            onClick={() => handleToggleBlock(row)}
          >
            {row.isBlocked ? 'Unblock' : 'Block'}
          </Button>
        </div>
      ),
    },
  ]

  if (isError) return <ErrorFallback error={error as Error} resetErrorBoundary={refetch} />

  const users = data?.data ?? []
  const pagination = data?.pagination

  return (
    <div>
      <AdminPageHeader title="Users" description="View and manage registered users." />

      <DataTable
        columns={columns as never}
        data={users as never}
        isLoading={isLoading}
        emptyMessage="No users found."
      />

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-2">
          <TablePagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.totalResults}
            limit={pagination.limit}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  )
}
