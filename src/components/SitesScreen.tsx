import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Globe, 
  ExternalLink, 
  MessageSquare, 
  Edit3, 
  Trash2, 
  Power, 
  ChevronDown, 
  ChevronUp, 
  Shield, 
  Settings2,
  X,
  Check
} from 'lucide-react';
import { Site, WordPressType, SeoPlugin, PageBuilder } from '../types';

interface SitesScreenProps {
  sites: Site[];
  onToggleConnectSite: (site: Site) => void;
  onAddSite: (site: Site) => void;
  onUpdateSite: (site: Site) => void;
  onDeleteSite: (siteId: string) => void;
  onSelectSiteForChat: (site: Site) => void;
}

export const SitesScreen: React.FC<SitesScreenProps> = ({
  sites,
  onToggleConnectSite,
  onAddSite,
  onUpdateSite,
  onDeleteSite,
  onSelectSiteForChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSiteId, setExpandedSiteId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    siteName: '',
    websiteUrl: 'https://',
    clientCompanyName: '',
    mcpEndpoint: '',
    wordPressType: 'SELF_HOSTED' as WordPressType,
    seoPlugin: 'YOAST' as SeoPlugin,
    pageBuilder: 'GUTENBERG' as PageBuilder,
    notes: '',
    aiInstructions: '',
  });

  const filteredSites = sites.filter(
    (s) =>
      s.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.websiteUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.clientCompanyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingSite(null);
    setFormData({
      siteName: '',
      websiteUrl: 'https://',
      clientCompanyName: '',
      mcpEndpoint: '',
      wordPressType: 'SELF_HOSTED',
      seoPlugin: 'YOAST',
      pageBuilder: 'GUTENBERG',
      notes: '',
      aiInstructions: '',
    });
    setModalMode('create');
  };

  const openEditModal = (site: Site) => {
    setEditingSite(site);
    setFormData({
      siteName: site.siteName,
      websiteUrl: site.websiteUrl,
      clientCompanyName: site.clientCompanyName,
      mcpEndpoint: site.mcpEndpoint,
      wordPressType: site.wordPressType,
      seoPlugin: site.seoPlugin,
      pageBuilder: site.pageBuilder,
      notes: site.notes,
      aiInstructions: site.aiInstructions,
    });
    setModalMode('edit');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.siteName.trim()) return;

    if (modalMode === 'create') {
      const newSite: Site = {
        id: `site-${Date.now()}`,
        siteName: formData.siteName,
        websiteUrl: formData.websiteUrl,
        clientCompanyName: formData.clientCompanyName,
        mcpEndpoint: formData.mcpEndpoint,
        mcpStatus: 'DISCONNECTED',
        wordPressType: formData.wordPressType,
        seoPlugin: formData.seoPlugin,
        pageBuilder: formData.pageBuilder,
        notes: formData.notes,
        aiInstructions: formData.aiInstructions,
        permissionPolicy: {
          siteId: `site-${Date.now()}`,
          requireApprovalForDeletePages: true,
          requireApprovalForDeletePosts: true,
          requireApprovalForSiteSettings: true,
          requireApprovalForPublishing: true,
          requireApprovalForPlugins: true,
          requireApprovalForThemes: true,
          requireApprovalForUsers: true,
          requireApprovalForDns: true,
          requireApprovalForBulkEdit: true,
        },
        lastConnection: 'Never',
        lastActivity: 'Site registered',
        isDemo: false,
      };
      onAddSite(newSite);
    } else if (modalMode === 'edit' && editingSite) {
      const updatedSite: Site = {
        ...editingSite,
        siteName: formData.siteName,
        websiteUrl: formData.websiteUrl,
        clientCompanyName: formData.clientCompanyName,
        mcpEndpoint: formData.mcpEndpoint,
        wordPressType: formData.wordPressType,
        seoPlugin: formData.seoPlugin,
        pageBuilder: formData.pageBuilder,
        notes: formData.notes,
        aiInstructions: formData.aiInstructions,
      };
      onUpdateSite(updatedSite);
    }

    setModalMode(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto w-full">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-neutral-100 uppercase tracking-wider font-mono">
              WordPress Client Sites
            </h1>
            <span className="text-xs font-mono text-neutral-400">
              ({sites.length} Fleet Installations)
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage per-site MCP endpoints, SEO stack configs, builder environments, and AI directives
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add WordPress Site</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by site name, client company, or domain URL..."
          className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-500 outline-none transition-colors"
        />
      </div>

      {/* Sites Cards List */}
      <div className="space-y-3">
        {filteredSites.map((site) => {
          const isExpanded = expandedSiteId === site.id;
          const isConnected = site.mcpStatus === 'CONNECTED';

          return (
            <div
              key={site.id}
              className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700/80 rounded-xl transition-all overflow-hidden"
            >
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Site Info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-sm font-bold text-neutral-100">{site.siteName}</h3>
                    {site.isDemo && (
                      <span className="text-[9px] font-mono uppercase bg-neutral-950 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
                        Demo
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1.5 ${
                        isConnected
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isConnected ? 'bg-emerald-400' : 'bg-neutral-500'
                        }`}
                      />
                      {isConnected ? 'MCP Connected' : 'MCP Disconnected'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-400 flex-wrap">
                    <a
                      href={site.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400/90 hover:underline flex items-center gap-1 font-mono text-[11px]"
                    >
                      {site.websiteUrl}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <span>·</span>
                    <span className="text-neutral-300 font-medium">{site.clientCompanyName}</span>
                    <span>·</span>
                    <span className="text-neutral-500">{site.wordPressType}</span>
                  </div>

                  {/* Tech stack tags */}
                  <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 pt-1">
                    <span className="bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                      SEO: {site.seoPlugin}
                    </span>
                    <span className="bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                      Builder: {site.pageBuilder}
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {/* Connect / Disconnect button */}
                  <button
                    onClick={() => onToggleConnectSite(site)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      isConnected
                        ? 'border-emerald-600/60 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-950/40'
                        : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{isConnected ? 'Disconnect' : 'Connect'}</span>
                  </button>

                  {/* Open Chat in site context */}
                  <button
                    onClick={() => onSelectSiteForChat(site)}
                    title="Open Isolated AI Chat for this site"
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit site */}
                  <button
                    onClick={() => openEditModal(site)}
                    title="Edit site details"
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete site */}
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete configuration for ${site.siteName}?`)) {
                        onDeleteSite(site.id);
                      }
                    }}
                    title="Delete site"
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 border border-neutral-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Expand Details */}
                  <button
                    onClick={() => setExpandedSiteId(isExpanded ? null : site.id)}
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border border-neutral-700 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Expandable Technical Specs & Directives */}
              {isExpanded && (
                <div className="bg-neutral-950 border-t border-neutral-800 p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                          Remote MCP Endpoint
                        </span>
                        <span className="font-mono text-neutral-300 break-all">
                          {site.mcpEndpoint || 'No endpoint specified (Local stub)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                          Operations Notes
                        </span>
                        <p className="text-neutral-300 leading-relaxed">
                          {site.notes || 'None recorded.'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                          AI Prompt Directives
                        </span>
                        <p className="text-neutral-300 leading-relaxed">
                          {site.aiInstructions || 'Standard WordPress management directives apply.'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
                        <span>Last Handshake: {site.lastConnection}</span>
                        <span>Activity: {site.lastActivity}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Site Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-700/80 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider font-mono">
                {modalMode === 'create' ? 'Add WordPress Client Site' : 'Edit Site Specifications'}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="text-neutral-400 hover:text-neutral-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 overflow-y-auto flex-1 pr-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-400 font-medium">Site Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.siteName}
                    onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                    placeholder="e.g. Juba Raha Paradise Hotel"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-100 outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-400 font-medium">Client / Company Name</label>
                  <input
                    type="text"
                    value={formData.clientCompanyName}
                    onChange={(e) => setFormData({ ...formData, clientCompanyName: e.target.value })}
                    placeholder="e.g. Juba Raha Hospitality Group"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-100 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-400 font-medium">Website URL *</label>
                  <input
                    type="url"
                    required
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-100 outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-400 font-medium">Remote MCP Endpoint</label>
                  <input
                    type="text"
                    value={formData.mcpEndpoint}
                    onChange={(e) => setFormData({ ...formData, mcpEndpoint: e.target.value })}
                    placeholder="https://mcp.clientdomain.com/v1"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-100 outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Selectors for WordPress Type, SEO Plugin, Builder */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 font-medium">WordPress Type</label>
                  <select
                    value={formData.wordPressType}
                    onChange={(e) => setFormData({ ...formData, wordPressType: e.target.value as WordPressType })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 outline-none"
                  >
                    <option value="SELF_HOSTED">Self-Hosted</option>
                    <option value="WORDPRESS_COM">WordPress.com VIP</option>
                    <option value="HEADLESS">Headless (GraphQL)</option>
                    <option value="MULTISITE">Multisite Network</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 font-medium">SEO Plugin</label>
                  <select
                    value={formData.seoPlugin}
                    onChange={(e) => setFormData({ ...formData, seoPlugin: e.target.value as SeoPlugin })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 outline-none"
                  >
                    <option value="YOAST">Yoast SEO</option>
                    <option value="RANK_MATH">Rank Math</option>
                    <option value="AIO_SEO">All in One SEO</option>
                    <option value="THE_SEO_FRAMEWORK">The SEO Framework</option>
                    <option value="NONE">None / Custom</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 font-medium">Page Builder</label>
                  <select
                    value={formData.pageBuilder}
                    onChange={(e) => setFormData({ ...formData, pageBuilder: e.target.value as PageBuilder })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 outline-none"
                  >
                    <option value="GUTENBERG">Block (Gutenberg)</option>
                    <option value="ELEMENTOR">Elementor Pro</option>
                    <option value="DIVI">Divi</option>
                    <option value="BEAVER_BUILDER">Beaver Builder</option>
                    <option value="BRICKS">Bricks</option>
                    <option value="NONE">Classic / Code</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400 font-medium">Site Operational Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Special plugins, hosting provider info, staging credentials references..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-100 outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400 font-medium">Site-Specific AI Directives</label>
                <textarea
                  rows={2}
                  value={formData.aiInstructions}
                  onChange={(e) => setFormData({ ...formData, aiInstructions: e.target.value })}
                  placeholder="Tone requirements, brand rules, mandatory CTA verification checks..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-100 outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg transition-colors"
                >
                  Save Site Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
