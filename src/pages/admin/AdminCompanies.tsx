import { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  DollarSign,
} from 'lucide-react';
import { useAdminStore } from '@/store/admin.store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { AdminCompany, Sector } from '@/types';

const SECTORS: Sector[] = ['Technology', 'Energy', 'Finance', 'Healthcare', 'Consumer', 'Industrial', 'Materials'];

const INDUSTRIES: Record<string, string[]> = {
  Technology: ['IT Services', 'Software', 'Hardware', 'Semiconductors', 'Internet'],
  Energy: ['Oil & Gas', 'Renewable Energy', 'Utilities', 'Petrochemicals'],
  Finance: ['Banking', 'Insurance', 'Asset Management', 'NBFC'],
  Healthcare: ['Pharmaceuticals', 'Hospitality', 'Biotech', 'Medical Devices'],
  Consumer: ['Retail', 'FMCG', 'E-commerce', 'Consumer Durables'],
  Industrial: ['Manufacturing', 'Construction', 'Automotive', 'Aerospace'],
  Materials: ['Metals & Mining', 'Chemicals', 'Cement', 'Paper'],
};

const COLORS = [
  '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4',
];

export function AdminCompaniesPage() {
  const companies = useAdminStore((s) => s.companies);
  const addCompany = useAdminStore((s) => s.addCompany);
  const updateCompany = useAdminStore((s) => s.updateCompany);
  const deleteCompany = useAdminStore((s) => s.deleteCompany);
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<AdminCompany | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    ticker: '',
    sector: 'Technology' as Sector,
    industry: '',
    marketCapCr: 0,
    description: '',
    color: '#2563EB',
  });

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.ticker.toLowerCase().includes(search.toLowerCase());
    const matchesSector = sectorFilter === 'all' || c.sector === sectorFilter;
    return matchesSearch && matchesSector;
  });

  const handleOpenEdit = (company?: AdminCompany) => {
    if (company) {
      setSelectedCompany(company);
      setFormData({
        name: company.name,
        ticker: company.ticker,
        sector: company.sector,
        industry: company.industry,
        marketCapCr: company.marketCapCr,
        description: company.description || '',
        color: company.color,
      });
    } else {
      setSelectedCompany(null);
      setFormData({
        name: '',
        ticker: '',
        sector: 'Technology',
        industry: '',
        marketCapCr: 0,
        description: '',
        color: '#2563EB',
      });
    }
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.ticker || !formData.industry) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedCompany) {
      updateCompany(selectedCompany.id, formData);
      toast({
        title: 'Company updated',
        description: `${formData.name} has been updated successfully.`,
      });
    } else {
      addCompany(formData);
      toast({
        title: 'Company added',
        description: `${formData.name} has been added to the platform.`,
      });
    }
    setEditDialogOpen(false);
    setSelectedCompany(null);
  };

  const handleDelete = () => {
    if (selectedCompany) {
      deleteCompany(selectedCompany.id);
      toast({
        title: 'Company deleted',
        description: `${selectedCompany.name} has been removed.`,
      });
      setDeleteDialogOpen(false);
      setSelectedCompany(null);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 100000) return `${(value / 100000).toFixed(1)}L Cr`;
    return `${value.toLocaleString('en-IN')} Cr`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Companies</h1>
          <p className="text-muted-foreground mt-1">
            Add, edit, or remove companies from the platform.
          </p>
        </div>
        <Button onClick={() => handleOpenEdit()}>
          <Plus className="size-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Sectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {SECTORS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCompanies.map((company) => (
          <Card key={company.id} className="overflow-hidden">
            <div
              className="h-2"
              style={{ backgroundColor: company.color }}
            />
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="size-12 rounded-xl grid place-items-center text-white font-bold text-lg shrink-0"
                    style={{ backgroundColor: company.color }}
                  >
                    {company.ticker.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{company.name}</h3>
                    <p className="text-sm text-muted-foreground">{company.ticker}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenEdit(company)}>
                      <Edit className="size-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                        setSelectedCompany(company);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="size-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs">
                    {company.sector}
                  </Badge>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{company.industry}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <DollarSign className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Market Cap</p>
                      <p className="text-sm font-medium">{formatCurrency(company.marketCapCr)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <FileText className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Documents</p>
                      <p className="text-sm font-medium">{company.documentCount || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-2">
              <Building2 className="size-10 text-muted-foreground/40" />
              <p className="text-muted-foreground">No companies found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit/Add Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedCompany ? 'Edit Company' : 'Add Company'}</DialogTitle>
            <DialogDescription>
              {selectedCompany
                ? 'Update company information and settings.'
                : 'Add a new company to the platform.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Tata Consultancy Services"
                />
              </div>
              <div className="space-y-2">
                <Label>Ticker Symbol *</Label>
                <Input
                  value={formData.ticker}
                  onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                  placeholder="e.g., TCS"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sector *</Label>
                <Select
                  value={formData.sector}
                  onValueChange={(v) => setFormData({ ...formData, sector: v as Sector, industry: '' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Industry *</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(v) => setFormData({ ...formData, industry: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {(INDUSTRIES[formData.sector] || []).map((i) => (
                      <SelectItem key={i} value={i}>
                        {i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Market Cap (Cr INR)</Label>
                <Input
                  type="number"
                  value={formData.marketCapCr || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, marketCapCr: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="e.g., 1480000"
                />
              </div>
              <div className="space-y-2">
                <Label>Brand Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={cn(
                        'size-8 rounded-lg transition-all',
                        formData.color === c ? 'ring-2 ring-offset-2 ring-foreground' : ''
                      )}
                      style={{ backgroundColor: c }}
                      onClick={() => setFormData({ ...formData, color: c })}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief company description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {selectedCompany ? 'Save Changes' : 'Add Company'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedCompany?.name}"? This will also delete all
              associated documents and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
