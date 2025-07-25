import React, { useRef, useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import axios from 'axios';

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

interface ApiResponse {
  data: Artwork[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    total_pages: number;
    current_page: number;
    next_url: string;
  };
}

export default function ArtworkTable() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedArtworks, setSelectedArtworks] = useState<Artwork[]>([]);
  const [selectionMap, setSelectionMap] = useState<{ [key: number]: Artwork }>({});
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [inputValue, setInputValue] = useState<number>(0);
  const op = useRef<OverlayPanel>(null);
  const rows = 12;

  useEffect(() => {
    fetchArtworks(page);
  }, [page]);

  const fetchArtworks = async (pageNumber: number) => {
    const response = await axios.get<ApiResponse>(
      `https://api.artic.edu/api/v1/artworks?page=${pageNumber}&limit=${rows}`,
      { headers: { 'Cache-Control': 'no-cache' } }
    );
    setArtworks(response.data.data);
    setTotalRecords(response.data.pagination.total);
  };

  const onPageChange = (e: any) => {
    setPage(e.page + 1);
  };

  const handleRowSelect = () => {
    let remaining = inputValue;
    let currentPage = page;
    const newSelected: { [key: number]: Artwork } = { ...selectionMap };

    const fetchAndSelect = async () => {
      while (remaining > 0) {
        const res = await axios.get<ApiResponse>(
          `https://api.artic.edu/api/v1/artworks?page=${currentPage}&limit=${rows}`,
          { headers: { 'Cache-Control': 'no-cache' } }
        );
        const pageItems = res.data.data;
        const toTake = Math.min(remaining, pageItems.length);

        pageItems.slice(0, toTake).forEach((item) => {
          newSelected[item.id] = item;
        });

        remaining -= toTake;
        currentPage++;
      }

      setSelectionMap(newSelected);
      setSelectedArtworks(Object.values(newSelected));
      op.current?.hide();
    };

    fetchAndSelect();
  };

  const onSelectionChange = (e: any) => {
    const newMap = { ...selectionMap };

    // Add or remove based on selection
    const selectedIds = new Set(e.value.map((item: Artwork) => item.id));
    artworks.forEach((item) => {
      if (selectedIds.has(item.id)) {
        newMap[item.id] = item;
      } else {
        delete newMap[item.id];
      }
    });

    setSelectionMap(newMap);
    setSelectedArtworks(Object.values(newMap));
  };

  const customHeader = () => (
    <th>
      <Button
        icon="pi pi-chevron-down"
        onClick={(e) => op.current?.toggle(e)}
        rounded
        text
        aria-label="Custom Select"
      />
      <OverlayPanel ref={op}>
        <div className="p-2">
          <input
            type="number"
            placeholder="Enter number"
            className="p-inputtext p-component"
            value={inputValue}
            onChange={(e) => setInputValue(Number(e.target.value))}
            style={{ marginRight: '0.5rem' }}
          />
          <Button label="Select" onClick={handleRowSelect} />
        </div>
      </OverlayPanel>
    </th>
  );

  return (
    <div className="card">
      <DataTable
        value={artworks}
        paginator
        rows={rows}
        totalRecords={totalRecords}
        onPage={onPageChange}
        lazy
        first={(page - 1) * rows}
        selection={Object.values(selectionMap)}
        onSelectionChange={onSelectionChange}
        dataKey="id"
      >
        <Column selectionMode="multiple" style={{ width: '3rem' }} />
        <Column header={customHeader} />
        <Column field="title" header="Title" />
        <Column field="place_of_origin" header="Place of Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Date Start" />
        <Column field="date_end" header="Date End" />
      </DataTable>
    </div>
  );
}
