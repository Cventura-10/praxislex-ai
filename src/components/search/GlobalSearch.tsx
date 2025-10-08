import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalSearch, SearchResult } from "@/hooks/useGlobalSearch";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { FileText, Users, File, Receipt, Clock, Search } from "lucide-react";

/**
 * Global search component with keyboard shortcut (Cmd/Ctrl + K)
 * Searches across all entities with full-text search
 */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { query, setQuery, results, loading, recentSearches, clearRecentSearches } = useGlobalSearch();

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'case':
        return <FileText className="mr-2 h-4 w-4" />;
      case 'client':
        return <Users className="mr-2 h-4 w-4" />;
      case 'document':
        return <File className="mr-2 h-4 w-4" />;
      case 'invoice':
        return <Receipt className="mr-2 h-4 w-4" />;
      default:
        return <Search className="mr-2 h-4 w-4" />;
    }
  };

  const getEntityUrl = (result: SearchResult): string => {
    switch (result.entity_type) {
      case 'case':
        return '/casos';
      case 'client':
        return '/clientes';
      case 'document':
        return '/documentos';
      case 'invoice':
        return '/facturacion';
      default:
        return '/dashboard';
    }
  };

  const getEntityLabel = (type: string): string => {
    switch (type) {
      case 'case':
        return 'Casos';
      case 'client':
        return 'Clientes';
      case 'document':
        return 'Documentos';
      case 'invoice':
        return 'Facturas';
      default:
        return 'Otros';
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.entity_type]) {
      acc[result.entity_type] = [];
    }
    acc[result.entity_type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const handleSelect = (url: string) => {
    setOpen(false);
    setQuery('');
    navigate(url);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <Search className="h-4 w-4" />
        <span>Buscar...</span>
        <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar casos, clientes, documentos, facturas..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {loading ? 'Buscando...' : 'No se encontraron resultados'}
          </CommandEmpty>

          {!query && recentSearches.length > 0 && (
            <>
              <CommandGroup heading="Búsquedas recientes">
                {recentSearches.map((search, index) => (
                  <CommandItem
                    key={index}
                    onSelect={() => setQuery(search)}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    <span>{search}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {Object.entries(groupedResults).map(([type, items]) => (
            <CommandGroup key={type} heading={getEntityLabel(type)}>
              {items.map((result) => (
                <CommandItem
                  key={result.entity_id}
                  value={result.title}
                  onSelect={() => handleSelect(getEntityUrl(result))}
                >
                  {getEntityIcon(result.entity_type)}
                  <div className="flex flex-col">
                    <span className="font-medium">{result.title}</span>
                    {result.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {result.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
