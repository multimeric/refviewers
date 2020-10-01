import React, {useMemo, useState} from 'react';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Link from '@material-ui/core/Link';
import Button from '@material-ui/core/Button';
import Cite from 'citation-js';
import MUIDataTable from 'mui-datatables';
import {Grid} from '@material-ui/core';
import sanitizeHtml from 'sanitize-html';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';

function Copyright() {
    return (
        <Typography variant="body2" color="textSecondary" align="center">
            {'Copyright © '}
            <Link color="inherit" href="https://material-ui.com/">
                Michael Milton
            </Link>{' '}
            {new Date().getFullYear()}
            {'.'}
        </Typography>
    );
}

/**
 * Outputs CSL JSON from an arbitrary citation file
 * @returns {Promise<*>}
 */
async function parseFile(file) {
    const contents = await file.text();
    const example = new Cite(contents);
    return example.format('data', {format: 'object'});
}

class Author {
    constructor(name) {
        this.fullName = name;
        this.authorships = [];
        this.firstAuthorships = [];
        this.lastAuthorships = [];
    }
}

/**
 * Returns a sanitized string to use as the name of a work
 * @returns {*}
 */
function workDisplayName(work){
    return sanitizeHtml(work.title, {
        allowedTags: [],
        allowedAttributes: {}
    });
}

/**
 * Takes a list of publication objects and returns a react element that visualises this
 * @param value
 */
function renderWorkList(value){
    return (
            <>
            { value.map(work => <Link href={work.URL}>{workDisplayName(work)} </Link>) }
            </>
        );
}

/**
 * Takes a list of publication objects and returns a react element that visualises the length of items
 * @param value
 */
function renderCount(value){
    return value.length;
}

/**
 * Returns an ID used to key a dictionary, unique to a certain author
 * @param author
 */
function authorId(author) {
    const names = [];
    if ('given' in author && author.given.length > 0) {
        names.push(author.given.trim().split(' ')[0]);
    }
    if ('family' in author && author.family.length > 0) {
        names.push(author.family.trim().split(' ')[0]);
    }
    return names.join('|');
}

/**
 * Converts the citation file into an array of author objects
 * @param citations
 * @returns {any[]}
 */
function getAuthors(citations) {
    const authors = new Map();
    for (let work of citations) {
        if (!Array.isArray(work.author)) {
            continue;
        }
        work.author.forEach((author, i) => {
            const authorLookup = authorId(author);
            let authorObj;
            if (!authors.has(authorLookup)) {
                authorObj = new Author(author.given + ' ' + author.family);
                authors.set(authorLookup, authorObj);
            }
            else {
                authorObj = authors.get(authorLookup);
            }

            authorObj.authorships.push(work);
            if (i === 0) {
                authorObj.firstAuthorships.push(work);
            }
            if (i === work.author.length - 1) {
                authorObj.lastAuthorships.push(work);
            }
        });
    }

    return Array.from(authors.values());
}

export default function App() {
    const [file, setFile] = useState();
    const [error, setError] = useState(null);
    const authors = useMemo(() => {
        if (file) {
            return getAuthors(file);
        }
    }, [file]);

    return (
        <Container maxWidth="md">
            <AppBar position="static">
                <Toolbar>
                    <Box flexGrow={1}>
                        <Typography variant="h2">
                            refviewers
                        </Typography>
                    </Box>
                    <Button href="https://github.com/TMiguelT/refviewers" color="inherit">GitHub</Button>
                </Toolbar>
            </AppBar>
            <Box my={4}>
                <Grid container spacing={2} alignItems={'center'} direction={'column'}>
                    <Grid item>
                        <Typography variant="body1" component="h1" gutterBottom>
                            <code>refviewers</code> is a simple browser utility for recommending reviewers for your manuscript, in
                            case you are submitting a paper to a journal that requires this.
                        </Typography>
                        <Typography variant="body1" component="h1" gutterBottom>
                            The general idea is that the authors in the papers that you have cited are more likely to 
                            be well-informed reviewers, and the more papers of theirs you have cited, the more
                            relevant they will be. Thus, <code>refviewers</code> produces a table sorted by the number 
                            of times you have cited each.
                        </Typography>
                        <Typography variant="body1" component="h1" gutterBottom>
                            To use, simply upload a RIS, BibTeX or CSL-JSON file generated by your citation manager.
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Button
                            variant="contained"
                            component="label"
                        >
                            Upload File
                            <input
                                type="file"
                                style={{display: 'none'}}
                                onChange={event => {
                                    const fileType = event.currentTarget.files[0].type;
                                    parseFile(event.currentTarget.files[0]).then(parsed => setFile(parsed)).catch(e => {
                                        setError(`Invalid file type! You provided ${fileType}, which is not supported.`);
                                    });
                                }}
                            />
                        </Button>
                    </Grid>
                    <Grid item>
                        {file &&
                        <MUIDataTable
                            title={'Authors'}
                            data={authors}
                            columns={[
                                {
                                    name: 'fullName',
                                    label: 'Full Name',
                                    options: {
                                        sort: false,
                                        customBodyRenderLite(dataIndex, rowIndex){
                                            return <Link href={encodeURI(`https://scholar.google.com/scholar?q=author:"${authors[dataIndex].fullName}"`)}>{authors[dataIndex].fullName}</Link>
                                        }
                                    }
                                },
                                {
                                    name: 'authorships',
                                    label: 'All Authorships',
                                    options: {
                                        sort: false,
                                        customBodyRender: renderWorkList
                                    }
                                },
                                {
                                    name: 'authorships',
                                    label: 'Total Authorships',
                                    options: {
                                        sort: true,
                                        sortDirection: 'desc',
                                        customBodyRender: renderCount
                                    }
                                },
                                {
                                    name: 'firstAuthorships',
                                    label: 'First Authorships',
                                    options: {
                                        sort: false,
                                        display: false,
                                        customBodyRender: renderWorkList
                                    }
                                },
                                {
                                    name: 'firstAuthorships',
                                    label: 'Total First Authorships',
                                    options: {
                                        sort: true,
                                        customBodyRender: renderCount
                                    }
                                },
                                {
                                    name: 'lastAuthorships',
                                    label: 'Last Authorships',
                                    options: {
                                        sort: false,
                                        display: false,
                                        customBodyRender: renderWorkList
                                    }
                                },
                                {
                                    name: 'lastAuthorships',
                                    label: 'Total Last Authorships',
                                    options: {
                                        sort: true,
                                        customBodyRender: renderCount
                                    }
                                },
                            ]}
                        />
                        }
                    </Grid>
                    <Grid item>
                        <Copyright/>
                    </Grid>
                </Grid>
            </Box>
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <MuiAlert variant={'filled'} onClose={() => setError(null)} severity="error">
                    {error || ''}
                </MuiAlert>
            </Snackbar>
        </Container>
    );
}
