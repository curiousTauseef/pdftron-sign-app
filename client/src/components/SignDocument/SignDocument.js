import React, { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Column,
  Heading,
  Row,
  Stack,
  Text,
  Button,
  SelectList,
} from 'gestalt';
import { selectAssignees } from '../Assign/AssignSlice';
import WebViewer from '@pdftron/webviewer';
import 'gestalt/dist/gestalt.css';
import './SignDocument.css';

const SignDocument = () => {
  const [instance, setInstance] = useState(null);
  const [dropPoint, setDropPoint] = useState(null);

  const assignees = useSelector(selectAssignees);
  const assigneesValues = assignees.map(user => {
    return { value: user.email, label: user.name };
  });
  let initialAssignee =
    assigneesValues.length > 0 ? assigneesValues[0].value : '';
  const [assignee, setAssignee] = useState(initialAssignee);

  const viewer = useRef(null);
  const filePicker = useRef(null);
  const addSignature = useRef(null);
  const addText = useRef(null);

  // if using a class, equivalent of componentDidMount
  useEffect(() => {
    WebViewer(
      {
        path: 'webviewer',
        disabledElements: [
          'toolsButton',
          'searchButton',
          'menuButton',
          'contextMenuPopup',
          'freeHandToolGroupButton',
          'textToolGroupButton',
          'shapeToolGroupButton',
          'signatureToolButton',
          'eraserToolButton',
          'stickyToolButton',
          'miscToolGroupButton',
        ],
      },
      viewer.current,
    ).then(instance => {
      const { iframeWindow } = instance;

      setInstance(instance);

      const iframeDoc = iframeWindow.document.body;
      iframeDoc.addEventListener('dragover', dragOver);
      iframeDoc.addEventListener('drop', (e) => {drop(e, instance)});

      filePicker.current.onchange = e => {
        const file = e.target.files[0];
        if (file) {
          instance.loadDocument(file);
        }
      };
    });
  }, []);

  const addField = (type, point = {}, name = '', value = '', flag = {}) => {
    const { docViewer, Annotations } = instance;
    const annotManager = docViewer.getAnnotationManager();
    const doc = docViewer.getDocument();
    const displayMode = docViewer.getDisplayModeManager().getDisplayMode();
    const page = displayMode.getSelectedPages(point, point);
    if (!!point.x && page.first == null) {
      return; //don't add field to an invalid page location
    }
    const page_idx =
      page.first !== null ? page.first : docViewer.getCurrentPage() - 1;
    const page_info = doc.getPageInfo(page_idx);
    const page_point = displayMode.windowToPage(point, page_idx);
    const zoom = docViewer.getZoom();

    var textAnnot = new Annotations.FreeTextAnnotation();
    textAnnot.PageNumber = page_idx + 1;
    const rotation = docViewer.getCompleteRotation(page_idx + 1) * 90;
    textAnnot.Rotation = rotation;
    if (rotation === 270 || rotation === 90) {
      textAnnot.Width = 50.0 / zoom;
      textAnnot.Height = 250.0 / zoom;
    } else {
      textAnnot.Width = 250.0 / zoom;
      textAnnot.Height = 50.0 / zoom;
    }
    textAnnot.X = (page_point.x || page_info.width / 2) - textAnnot.Width / 2;
    textAnnot.Y = (page_point.y || page_info.height / 2) - textAnnot.Height / 2;

    textAnnot.setPadding(new Annotations.Rect(0, 0, 0, 0));
    textAnnot.custom = {
      type,
      value,
      flag,
      name: `${assignee}_${type}_`,
    };

    // set the type of annot
    textAnnot.setContents(textAnnot.custom.name);
    textAnnot.FontSize = '' + 20.0 / zoom + 'px';
    textAnnot.FillColor = new Annotations.Color(211, 211, 211, 0.5);
    textAnnot.TextColor = new Annotations.Color(0, 165, 228);
    textAnnot.StrokeThickness = 1;
    textAnnot.StrokeColor = new Annotations.Color(0, 165, 228);
    textAnnot.TextAlign = 'center';

    textAnnot.Author = annotManager.getCurrentUser();

    annotManager.deselectAllAnnotations();
    annotManager.addAnnotation(textAnnot, true);
    annotManager.redrawAnnotation(textAnnot);
    annotManager.selectAnnotation(textAnnot);
  };

  const download = () => {
    instance.downloadPdf(true);
  };

  const dragOver = e => {
    e.preventDefault();
    return false;
  };

  const drop = (e, instance) => {
    const { docViewer } = instance;
    const scrollElement = docViewer.getScrollViewElement();
    const scrollLeft = scrollElement.scrollLeft || 0;
    const scrollTop = scrollElement.scrollTop || 0;
    setDropPoint({ x: e.pageX + scrollLeft, y: e.pageY + scrollTop });
    e.preventDefault();
    return false;
  };

  const dragStart = e => {
    e.target.style.opacity = 0.5;
    const copy = e.target.cloneNode(true);
    copy.id = 'form-build-drag-image-copy';
    copy.style.width = '250px';
    document.body.appendChild(copy);
    e.dataTransfer.setDragImage(copy, 125, 25);
    e.dataTransfer.setData('text', '');
  };

  const dragEnd = (e, type) => {
    addField(type, dropPoint);
    e.target.style.opacity = 1;
    document.body.removeChild(
      document.getElementById('form-build-drag-image-copy'),
    );
    e.preventDefault();
  };

  return (
    <div>
      <Box display="flex" direction="row">
        <Column span={2}>
          <Box padding={3}>
            <Heading size="md">Sign Document</Heading>
          </Box>
          <Box padding={3}>
            <Row gap={1}>
              <Stack>
                <Box padding={2}>
                  <Text>{'Step 1'}</Text>
                </Box>
                <Box padding={2}>
                  <Button
                    onClick={() => {
                      if (filePicker) {
                        filePicker.current.click();
                      }
                    }}
                    accessibilityLabel="upload a document"
                    text="Upload a document"
                    iconEnd="add-circle"
                  />
                </Box>
              </Stack>
            </Row>
            <Row>
              <Stack>
                <Box padding={2}>
                  <Text>{'Step 2'}</Text>
                </Box>
                <Box padding={2}>
                  <SelectList
                    id="assigningFor"
                    name="assign"
                    onChange={({ value }) => setAssignee(value)}
                    options={assigneesValues}
                    placeholder="Select recipient"
                    label="Adding signature for"
                    value={assignee}
                  />
                </Box>
                <Box padding={2}>
                  <div
                    draggable
                    onDragStart={e => dragStart(e)}
                    onDragEnd={e => dragEnd(e, 'SIGNATURE')}
                  >
                    <Button
                      onClick={() => addField('SIGNATURE')}
                      accessibilityLabel="add signature"
                      text="Add signature"
                      iconEnd="compose"
                    />
                  </div>
                </Box>
                <Box padding={2}>
                  <div
                    draggable
                    onDragStart={e => dragStart(e)}
                    onDragEnd={e => dragEnd(e, 'TEXT')}
                  >
                    <Button
                      onClick={() => addField('TEXT')}
                      accessibilityLabel="add text"
                      text="Add text"
                      iconEnd="text-sentence-case"
                    />
                  </div>
                </Box>
              </Stack>
            </Row>
          </Box>
        </Column>
        <Column span={10}>
          <div className="webviewer" ref={viewer}></div>
        </Column>
      </Box>
      <input type="file" ref={filePicker} style={{ display: 'none' }} />
    </div>
  );
};

export default SignDocument;
